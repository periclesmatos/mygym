import { Icon } from '../ui/Icon'

export function initials(name, email) {
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

/** Recorta o centro da imagem e reduz para um quadrado JPEG, como data URL. */
export function squarePhoto(file, size = 320) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const side = Math.min(image.naturalWidth, image.naturalHeight)
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d')
      context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível abrir essa imagem.'))
    }
    image.src = url
  })
}
