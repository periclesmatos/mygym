import { useCallback } from 'react'
import { useFeedback } from '@/shared/ui/feedbackContext'

/**
 * Executa uma ação assíncrona e, se ela falhar, mostra a mensagem num toast de erro.
 * `onError` roda antes do toast (por exemplo, para desfazer uma mudança otimista).
 * Devolve true se deu certo.
 */
export function useAction() {
  const { toast } = useFeedback()
  return useCallback(
    async (action, onError) => {
      try {
        await action()
        return true
      } catch (caught) {
        onError?.(caught)
        toast(caught.message, 'error')
        return false
      }
    },
    [toast]
  )
}
