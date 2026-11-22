import { useAsync } from '@/shared/hooks/useAsync'
import { Avatar } from '@/shared/ui/Avatar'
import { socialApi } from '@/shared/api/social'

/** A foto vem à parte, para a lista não carregar todas no JSON. */
export function PersonAvatar({ person, size = 44 }) {
  const { data } = useAsync(
    () => (person.hasPhoto ? socialApi.photo(person.id) : Promise.resolve({ photo: null })),
    [person.id, person.hasPhoto]
  )
  return <Avatar size={size} profile={{ name: person.name.replace(/^@/, ''), photo: data?.photo }} />
}
