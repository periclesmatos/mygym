import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PersonAvatar } from '@/features/social/components/PersonAvatar'
import { useAction } from '@/shared/hooks/useAction'
import { useAsync } from '@/shared/hooks/useAsync'
import { relativeDay } from '@/shared/lib/date'
import { formatNumber } from '@/shared/lib/number'
import { Icon, IconButton } from '@/shared/ui/Icon'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RankBadge } from '@/shared/ui/RankBadge'
import { Action, ActionList, Sheet } from '@/shared/ui/Sheet'
import { StatCard } from '@/shared/ui/StatCard'
import { ErrorState, Skeleton } from '@/shared/ui/States'
import { useFeedback } from '@/shared/ui/feedbackContext'
import { socialApi } from '@/shared/api/social'

const BACK = '/rank?aba=amigos'

/** Perfil de amigo: rank e resumo, sem cargas nem medidas. */
export function FriendPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const runAction = useAction()
  const { confirm, toast } = useFeedback()
  const [menu, setMenu] = useState(false)
  const { data, error, reload } = useAsync(() => socialApi.friend(id), [id])

  if (!data) {
    return (
      <>
        <PageHeader back={BACK} title="Perfil" />
        {error ? <ErrorState message={error} onRetry={reload} /> : <Skeleton lines={5} />}
      </>
    )
  }
  const { person, summary, recent } = data

  async function leave(action, title, message, confirmLabel) {
    setMenu(false)
    const ok = await confirm({ title, message, confirmLabel, danger: true })
    if (!ok) return
    await runAction(async () => {
      await action(id)
      toast('Pronto.')
      navigate(BACK, { replace: true })
    })
  }

  return (
    <>
      <PageHeader
        back={BACK}
        title="Perfil"
        actions={<IconButton icon="more" label="Opções" onClick={() => setMenu(true)} />}
      />

      <section className="friend-hero">
        <PersonAvatar person={person} size={96} />
        <h2>{person.name}</h2>
        {person.username && <p className="muted">@{person.username}</p>}
      </section>

      <section className={`card friend-rank rank-${summary.rank.key}`}>
        <RankBadge rank={summary.rank} size={76} />
        <span className="person-text">
          <strong className="board-rank friend-rank-name">{summary.rank.label}</strong>
          <span className="tabular">{formatNumber(summary.points, 0)} pts</span>
          <span className="muted small">Recorde: {summary.peak.label}</span>
        </span>
      </section>

      <section className="stats">
        <StatCard icon="flame" value={summary.streak} label={summary.streak === 1 ? 'dia seguido' : 'dias seguidos'} />
        <StatCard
          icon="calendar"
          value={summary.monthWorkouts}
          label={summary.monthWorkouts === 1 ? 'treino no mês' : 'treinos no mês'}
        />
        <StatCard icon="run" value={`${summary.monthCardioMinutes} min`} label="cardio no mês" />
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Troféus</h2>
          <span className="muted small">{summary.trophies.length}</span>
        </div>
        {summary.trophies.length > 0 ? (
          <div className="won-trophies">
            {summary.trophies.map((trophy) => (
              <span key={trophy.key} className={`won-trophy tier-${trophy.tier}`}>
                <Icon name="trophy" size={16} filled />
                {trophy.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="muted small">Nenhum ainda.</p>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Últimos treinos</h2>
        </div>
        <ul className="card people">
          {recent.map((item) => (
            <li className="person" key={`${item.finishedAt}${item.name}`}>
              <strong className="person-text">{item.name}</strong>
              <span className="muted small">{relativeDay(item.finishedAt)}</span>
            </li>
          ))}
          {recent.length === 0 && <li className="muted small">Nenhum treino ainda.</li>}
        </ul>
      </section>

      <Sheet open={menu} onClose={() => setMenu(false)} title={person.name}>
        <ActionList>
          <Action
            icon={<Icon name="close" />}
            label="Desfazer amizade"
            danger
            onClick={() =>
              leave(socialApi.remove, 'Desfazer amizade?', 'Vocês deixam de ver o perfil um do outro.', 'Desfazer')
            }
          />
          <Action
            icon={<Icon name="lock" />}
            label="Bloquear"
            danger
            onClick={() =>
              leave(socialApi.block, 'Bloquear?', 'A amizade acaba e essa pessoa não te acha mais.', 'Bloquear')
            }
          />
        </ActionList>
      </Sheet>
    </>
  )
}
