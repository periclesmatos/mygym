import { useCallback, useRef } from 'react'

/**
 * Bipe duplo pelo WebAudio. `prime` precisa rodar num gesto do usuário (o navegador só libera
 * áudio assim); o bipe pode tocar depois, no fim do descanso.
 */
export function useBeep() {
  const audio = useRef(null)

  const prime = useCallback(() => {
    try {
      if (!audio.current) {
        const Context = window.AudioContext || window.webkitAudioContext
        if (Context) audio.current = new Context()
      }
      audio.current?.resume?.()
    } catch {
      /* sem áudio */
    }
  }, [])

  const beep = useCallback(() => {
    const context = audio.current
    if (!context) return
    try {
      for (const offset of [0, 0.22]) {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        const start = context.currentTime + offset
        oscillator.frequency.value = 880
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16)
        oscillator.connect(gain).connect(context.destination)
        oscillator.start(start)
        oscillator.stop(start + 0.18)
      }
    } catch {
      /* sem áudio */
    }
  }, [])

  return { prime, beep }
}
