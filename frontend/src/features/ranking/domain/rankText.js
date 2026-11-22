import { formatNumber } from '@/shared/lib/number'
import { plural } from '@/shared/lib/text'

export function points(value) {
  return `${formatNumber(value, 0)} ${value === 1 ? 'pt' : 'pts'}`
}

export function nextLine(overview) {
  if (!overview.next) return 'Topo da escada. Agora é manter.'
  // Espaço não separável: "Brabo I" não deixa o I sozinho na linha.
  return `Faltam ${formatNumber(overview.pointsToNext, 0)} para ${overview.next.label.replace(/ /g, '\u00a0')}`
}

export function effortLine(overview) {
  return overview.next ? `Cerca de ${plural(overview.workoutsToNext, 'treino', 'treinos')}` : ''
}

export function todayLine({ today }) {
  return `Hoje +${today.total}`
}

export function bonusLine({ nextBonus }) {
  if (!nextBonus) return ''
  return `Mais ${plural(nextBonus.days, 'dia', 'dias')} na semana: +${nextBonus.points} de bônus`
}

/** O aviso mais urgente: proteção, queda próxima ou o que sai amanhã. */
export function warning({ protection, fall, expiresTomorrow }) {
  if (protection) {
    const days = plural(protection.days, 'dia', 'dias')
    return { urgent: true, text: `Protegido por ${days}: faça ${points(protection.pointsToKeep)} para manter` }
  }
  if (fall) {
    const when = fall.days === 1 ? 'amanhã' : `em ${fall.days} dias`
    return { urgent: true, text: `Sem treinar, você cai para ${fall.rank.label} ${when}` }
  }
  if (expiresTomorrow > 0) return { urgent: false, text: `Amanhã saem ${points(expiresTomorrow)}` }
  return null
}

export function impactText({ status, points: gained }) {
  switch (status) {
    case 'SCORED':
      return { title: `+${points(gained)}`, text: 'é o que este treino vale no seu rank' }
    case 'LATE':
      return { title: 'Não pontua', text: 'só vale treino registrado até 7 dias depois' }
    case 'SHORT':
      return { title: 'Ainda não pontua', text: 'o dia precisa de 5 séries ou 10 min de cardio' }
    case 'EXPIRED':
      return { title: 'Fora da janela', text: 'já passou dos 90 dias do rank' }
    default:
      return { title: '+0 pts', text: 'o dia ou a semana já está no máximo' }
  }
}
