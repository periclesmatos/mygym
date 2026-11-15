import { useEffect, useState } from 'react'
import { exercisesApi } from '@/shared/api/exercises'

let namesCache = null

export function useExerciseNames() {
  const [names, setNames] = useState(namesCache || [])
  useEffect(() => {
    let active = true
    exercisesApi
      .names()
      .then((list) => {
        namesCache = list
        if (active) setNames(list)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  return names
}
