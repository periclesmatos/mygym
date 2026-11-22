import { PersonAvatar } from '@/features/social/components/PersonAvatar'

export function Person({ person, children }) {
  return (
    <li className="person">
      <PersonAvatar person={person} />
      <span className="person-text">
        <strong>{person.name}</strong>
        {person.username && <span className="muted small">@{person.username}</span>}
      </span>
      {children}
    </li>
  )
}
