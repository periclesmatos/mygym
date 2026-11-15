import { Icon } from '../ui/Icon'

function initials(name, email) {
  const source = (name || '').trim()
  if (source) {
    const parts = source.split(/\s+/)
    return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
  }
  return (email || '').trim().charAt(0).toUpperCase()
}

export function Avatar({ profile, size = 40 }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) }
  if (profile?.photo) {
    return <img className="avatar" src={profile.photo} alt="" style={style} />
  }
  const letters = initials(profile?.name, profile?.email)
  return (
    <span className="avatar" style={style} aria-hidden="true">
      {letters || <Icon name="user" size={Math.round(size * 0.5)} />}
    </span>
  )
}
