package com.appgym.social.application;

import com.appgym.identity.IdentityApi;
import com.appgym.identity.PublicUser;
import com.appgym.ranking.RankSummary;
import com.appgym.ranking.RankingApi;
import com.appgym.shared.error.BadRequestException;
import com.appgym.shared.error.NotFoundException;
import com.appgym.social.application.dto.FriendProfileView;
import com.appgym.social.application.dto.FriendProfileView.RecentWorkout;
import com.appgym.social.application.dto.FriendsView;
import com.appgym.social.application.dto.PendingView;
import com.appgym.social.application.dto.PersonView;
import com.appgym.social.application.dto.PhotoView;
import com.appgym.social.application.dto.SearchCommand;
import com.appgym.social.application.dto.SearchResultView;
import com.appgym.social.application.dto.SearchResultView.Relation;
import com.appgym.social.domain.Friendship;
import com.appgym.social.domain.FriendshipRepository;
import com.appgym.social.domain.SearchLimit;
import com.appgym.social.domain.UserBlock;
import com.appgym.social.domain.UserBlockRepository;
import com.appgym.workout.WorkoutApi;
import java.time.Clock;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Buscar, pedir, aceitar, remover, bloquear e ver o perfil de amigo. */
@Service
public class SocialService {
    private static final int MAX_RESULTS = 10;
    private static final int MAX_SENT = 50;
    private static final int RECENT = 5;

    private final FriendshipRepository friendships;
    private final UserBlockRepository blocks;
    private final IdentityApi identity;
    private final RankingApi ranking;
    private final WorkoutApi workouts;
    private final Clock clock;
    private final SearchLimit limit;

    public SocialService(
            FriendshipRepository friendships,
            UserBlockRepository blocks,
            IdentityApi identity,
            RankingApi ranking,
            WorkoutApi workouts,
            Clock clock) {
        this.friendships = friendships;
        this.blocks = blocks;
        this.identity = identity;
        this.ranking = ranking;
        this.workouts = workouts;
        this.clock = clock;
        this.limit = new SearchLimit(clock);
    }

    @Transactional(readOnly = true)
    public FriendsView overview(Long userId) {
        List<Long> friends = new ArrayList<>(List.of(userId));
        List<Long> received = new ArrayList<>();
        List<Long> sent = new ArrayList<>();
        for (Friendship item : friendships.listFor(userId)) {
            if (item.isAccepted()) friends.add(item.other(userId));
            else if (item.requestedBy(userId)) sent.add(item.other(userId));
            else received.add(item.other(userId));
        }
        List<Long> blocked = blocks.listInvolving(userId).stream()
                .filter(block -> block.getBlockerId().equals(userId))
                .map(block -> block.getBlockedId())
                .toList();

        List<Long> everyone = new ArrayList<>(friends);
        everyone.addAll(received);
        everyone.addAll(sent);
        everyone.addAll(blocked);
        Map<Long, PublicUser> people =
                identity.findAll(everyone).stream().collect(Collectors.toMap(user -> user.id(), Function.identity()));
        Map<Long, RankSummary> ranks = ranking.summaries(friends);
        List<FriendsView.Standing> board = friends.stream()
                .filter(people::containsKey)
                .map(id -> new FriendsView.Standing(
                        PersonView.of(people.get(id)),
                        ranks.get(id).points(),
                        ranks.get(id).rank(),
                        id.equals(userId)))
                .sorted(Comparator.comparingInt((FriendsView.Standing row) -> row.points())
                        .reversed()
                        .thenComparing(row -> row.person().name()))
                .toList();
        return new FriendsView(board, views(received, people), views(sent, people), views(blocked, people));
    }

    @Transactional(readOnly = true)
    public PendingView pending(Long userId) {
        return new PendingView(friendships.countReceived(userId));
    }

    @Transactional(readOnly = true)
    public List<SearchResultView> search(Long userId, SearchCommand command) {
        limit.hit(userId);
        Set<Long> hidden = blocks.listInvolving(userId).stream()
                .map(block -> block.getBlockerId().equals(userId) ? block.getBlockedId() : block.getBlockerId())
                .collect(Collectors.toSet());
        Map<Long, Friendship> known = friendships.listFor(userId).stream()
                .collect(Collectors.toMap(item -> item.other(userId), Function.identity()));
        return identity.search(command.query()).stream()
                .filter(user -> !user.id().equals(userId) && !hidden.contains(user.id()))
                .limit(MAX_RESULTS)
                .map(user -> new SearchResultView(PersonView.of(user), relation(userId, known.get(user.id()))))
                .toList();
    }

    /** Pedido cruzado vira amizade. */
    @Transactional
    public void request(Long userId, UUID publicId) {
        PublicUser other = reachable(userId, publicId);
        lock(userId, other.id());
        if (blocks.existsBetween(userId, other.id())) throw notFound();
        Optional<Friendship> existing = pair(userId, other.id());
        if (existing.isPresent()) {
            if (!existing.get().requestedBy(userId)) existing.get().accept(clock.instant());
            return;
        }
        if (friendships.countSent(userId) >= MAX_SENT) {
            throw new BadRequestException("Você já tem 50 pedidos esperando resposta.");
        }
        friendships.save(Friendship.request(userId, other.id(), clock.instant()));
    }

    @Transactional
    public void accept(Long userId, UUID publicId) {
        PublicUser other = reachable(userId, publicId);
        lock(userId, other.id());
        pair(userId, other.id())
                .filter(item -> !item.requestedBy(userId))
                .orElseThrow(() -> new NotFoundException("Esse pedido não existe mais."))
                .accept(clock.instant());
    }

    /** Recusa, cancela ou remove, conforme o estado. */
    @Transactional
    public void remove(Long userId, UUID publicId) {
        PublicUser other = reachable(userId, publicId);
        lock(userId, other.id());
        pair(userId, other.id()).ifPresent(friendships::delete);
    }

    @Transactional
    public void block(Long userId, UUID publicId) {
        PublicUser other = person(userId, publicId);
        lock(userId, other.id());
        if (blocks.findByBlockerIdAndBlockedId(userId, other.id()).isPresent()) return;
        // Quem foi bloqueado recebe o mesmo que para alguém que não existe.
        if (blocks.existsBetween(userId, other.id())) throw notFound();
        pair(userId, other.id()).ifPresent(friendships::delete);
        blocks.save(new UserBlock(userId, other.id(), clock.instant()));
    }

    @Transactional
    public void unblock(Long userId, UUID publicId) {
        PublicUser other = person(userId, publicId);
        Optional<UserBlock> mine = blocks.findByBlockerIdAndBlockedId(userId, other.id());
        if (mine.isPresent()) blocks.delete(mine.get());
        else if (blocks.existsBetween(userId, other.id())) throw notFound();
    }

    @Transactional(readOnly = true)
    public FriendProfileView profile(Long userId, UUID publicId) {
        PublicUser other = reachable(userId, publicId);
        pair(userId, other.id()).filter(item -> item.isAccepted()).orElseThrow(SocialService::notFound);
        List<RecentWorkout> recent = workouts.activities(List.of(other.id())).stream()
                .limit(RECENT)
                .map(session -> new RecentWorkout(session.name(), session.finishedAt()))
                .toList();
        return new FriendProfileView(PersonView.of(other), ranking.profile(other.id()), recent);
    }

    /** A foto aparece na prévia; o id público só se conhece pela busca ou por um pedido. */
    @Transactional(readOnly = true)
    public PhotoView photo(Long userId, UUID publicId) {
        PublicUser other = identity.find(publicId).orElseThrow(SocialService::notFound);
        if (!other.id().equals(userId) && blocks.existsBetween(userId, other.id())) throw notFound();
        return new PhotoView(identity.photo(other.id()).orElse(null));
    }

    private PublicUser reachable(Long userId, UUID publicId) {
        PublicUser other = person(userId, publicId);
        if (blocks.existsBetween(userId, other.id())) throw notFound();
        return other;
    }

    private PublicUser person(Long userId, UUID publicId) {
        return identity.find(publicId).filter(user -> !user.id().equals(userId)).orElseThrow(SocialService::notFound);
    }

    private void lock(Long first, Long second) {
        friendships.lockPair("social:" + Math.min(first, second) + ":" + Math.max(first, second));
    }

    private Optional<Friendship> pair(Long first, Long second) {
        return friendships.findPair(Math.min(first, second), Math.max(first, second));
    }

    private static List<PersonView> views(List<Long> ids, Map<Long, PublicUser> people) {
        return ids.stream()
                .map(people::get)
                .filter(Objects::nonNull)
                .map(PersonView::of)
                .toList();
    }

    private static Relation relation(Long userId, Friendship friendship) {
        if (friendship == null) return Relation.NONE;
        if (friendship.isAccepted()) return Relation.FRIEND;
        return friendship.requestedBy(userId) ? Relation.SENT : Relation.RECEIVED;
    }

    private static NotFoundException notFound() {
        return new NotFoundException("Pessoa não encontrada.");
    }
}
