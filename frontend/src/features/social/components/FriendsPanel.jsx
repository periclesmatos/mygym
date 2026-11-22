import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Person } from '@/features/social/components/Person'
import { PersonAvatar } from '@/features/social/components/PersonAvatar'
import { UsernameCard } from '@/features/social/components/UsernameCard'
import { PENDING_CHANGED } from '@/features/social/domain/pending'
import { useAction } from '@/shared/hooks/useAction'
import { useAsync } from '@/shared/hooks/useAsync'
import { formatNumber } from '@/shared/lib/number'
import { Icon, IconButton } from '@/shared/ui/Icon'
import { RankBadge } from '@/shared/ui/RankBadge'
import { Action, ActionList, Sheet } from '@/shared/ui/Sheet'
import { Empty, ErrorState, Skeleton } from '@/shared/ui/States'
import { useFeedback } from '@/shared/ui/feedbackContext'
import { profileApi } from '@/shared/api/identity'
import { socialApi } from '@/shared/api/social'

export function FriendsPanel() {
  const runAction = useAction()
  const { toast } = useFeedback()
  const { data, error, reload } = useAsync(() => socialApi.overview(), [])
  const { data: profile, setData: setProfile } = useAsync(() => profileApi.get(), [])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [menu, setMenu] = useState(null)

  async function search(event) {
    event.preventDefault()
    setSearching(true)
    await runAction(async () => {
      setResults(await socialApi.search(query.trim()))
    })
    setSearching(false)
  }

  async function act(action, message, person, relation) {
    setMenu(null)
    await runAction(async () => {
      await action(person.id)
      setResults((current) => {
        if (!current) return current
        if (!relation) return current.filter((item) => item.person.id !== person.id)
        return current.map((item) => (item.person.id === person.id ? { ...item, relation } : item))
      })
      toast(message, 'success')
      reload()
      window.dispatchEvent(new Event(PENDING_CHANGED))
    })
  }

  const add = (person) => act(socialApi.request, 'Pedido enviado.', person, 'SENT')
  const accept = (person) => act(socialApi.accept, 'Agora vocês são amigos.', person, 'FRIEND')

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <Skeleton lines={5} />
  const { board, received, sent, blocked } = data

  return (
    <>
      {profile && !profile.username && <UsernameCard onSaved={setProfile} />}

      <form className="friend-search" onSubmit={search}>
        <div className="search">
          <Icon name="search" size={20} />
          <input
            className="input"
            type="search"
            aria-label="Buscar por username, e-mail ou telefone"
            placeholder="@user, e-mail ou celular"
            autoCapitalize="none"
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setResults(null)
            }}
          />
        </div>
        {query.trim() && (
          <button type="submit" className="btn btn-primary" disabled={searching || query.trim().length < 3}>
            Buscar
          </button>
        )}
      </form>

      {results?.length === 0 && (
        <p className="muted small">
          Ninguém encontrado. E-mail e telefone precisam ser exatos, e só aparece quem confirmou o e-mail ou liberou o
          telefone.
        </p>
      )}
      {results?.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Resultado</h2>
          </div>
          <ul className="card people">
            {results.map(({ person, relation }) => (
              <Person key={person.id} person={person}>
                {relation === 'NONE' && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => add(person)}>
                    Adicionar
                  </button>
                )}
                {relation === 'RECEIVED' && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => accept(person)}>
                    Aceitar
                  </button>
                )}
                {relation === 'SENT' && <span className="muted small">Pedido enviado</span>}
                {relation === 'FRIEND' && (
                  <Link className="link-btn" to={`/amigos/${person.id}`}>
                    Ver perfil
                  </Link>
                )}
                <IconButton icon="more" label={`Opções de ${person.name}`} onClick={() => setMenu(person)} />
              </Person>
            ))}
          </ul>
        </section>
      )}

      {received.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Pedidos para você</h2>
          </div>
          <ul className="card people">
            {received.map((person) => (
              <Person key={person.id} person={person}>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => accept(person)}>
                  Aceitar
                </button>
                <IconButton
                  icon="close"
                  label={`Recusar ${person.name}`}
                  onClick={() => act(socialApi.remove, 'Pedido recusado.', person, 'NONE')}
                />
                <IconButton icon="more" label={`Opções de ${person.name}`} onClick={() => setMenu(person)} />
              </Person>
            ))}
          </ul>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>Ranking dos amigos</h2>
          <span className="muted small">últimos 90 dias</span>
        </div>
        <ol className="card people">
          {board.map(({ person, points, rank, me }, index) => {
            const row = (
              <>
                <span className="place tabular">{index + 1}</span>
                <PersonAvatar person={person} size={40} />
                <span className="person-text">
                  <strong>{me ? 'Você' : person.name}</strong>
                  <span className={`small board-rank rank-${rank.key}`}>{rank.label}</span>
                </span>
                <span className="board-points tabular">{formatNumber(points, 0)}</span>
                <RankBadge rank={{ ...rank, division: 0 }} size={34} />
              </>
            )
            return (
              <li key={person.id} className={me ? 'board-row me' : 'board-row'}>
                {me ? (
                  <div className="board-link">{row}</div>
                ) : (
                  <Link className="board-link" to={`/amigos/${person.id}`}>
                    {row}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
        {board.length === 1 && (
          <Empty icon="user" title="Sem amigos ainda" text="Busque pelo @username para comparar o rank." />
        )}
      </section>

      {sent.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Pedidos enviados</h2>
          </div>
          <ul className="card people">
            {sent.map((person) => (
              <Person key={person.id} person={person}>
                <button
                  type="button"
                  className="btn btn-quiet btn-sm"
                  onClick={() => act(socialApi.remove, 'Pedido cancelado.', person, 'NONE')}
                >
                  Cancelar
                </button>
              </Person>
            ))}
          </ul>
        </section>
      )}

      {blocked.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Bloqueados</h2>
          </div>
          <ul className="card people">
            {blocked.map((person) => (
              <Person key={person.id} person={person}>
                <button
                  type="button"
                  className="btn btn-quiet btn-sm"
                  onClick={() => act(socialApi.unblock, 'Desbloqueado.', person, 'NONE')}
                >
                  Desbloquear
                </button>
              </Person>
            ))}
          </ul>
        </section>
      )}

      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu?.name}>
        {menu && (
          <ActionList>
            <Action
              icon={<Icon name="lock" />}
              label="Bloquear"
              hint="Não te acha mais nem manda pedido"
              danger
              onClick={() => act(socialApi.block, 'Bloqueado.', menu, null)}
            />
          </ActionList>
        )}
      </Sheet>
    </>
  )
}
