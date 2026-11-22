import { ladderTiers } from '@/features/ranking/domain/ladder'
import { formatNumber } from '@/shared/lib/number'
import { Icon } from '@/shared/ui/Icon'
import { RankBadge } from '@/shared/ui/RankBadge'

/** Os 9 ranks, cada um com as divisões como barras que enchem. */
export function Ladder({ ladder, overview }) {
  const tiers = ladderTiers(ladder, overview)
  const position = tiers.length - tiers.findIndex((tier) => tier.state === 'current')
  return (
    <section className="section">
      <div className="section-head">
        <h2>Escada</h2>
        <span className="muted small">
          rank {position} de {tiers.length}
        </span>
      </div>
      <ol className="ladder">
        {tiers.map((tier) => (
          <li
            key={tier.key}
            className={`tier rank-${tier.key} ${tier.state}`}
            aria-current={tier.state === 'current' ? 'step' : undefined}
          >
            <RankBadge rank={{ key: tier.key, division: 0 }} size={56} />
            <div className="tier-main">
              <div className="tier-head">
                <strong className="tier-name">{tier.name}</strong>
                {tier.state === 'current' && <span className="tier-here">Você</span>}
                {tier.state === 'passed' && (
                  <span className="tier-done" role="img" aria-label="Conquistado">
                    <Icon name="check" size={16} strokeWidth={3} />
                  </span>
                )}
                {tier.state === 'ahead' && (
                  <span className="tier-missing tabular">faltam {formatNumber(tier.missing, 0)}</span>
                )}
              </div>
              <div className="tier-steps">
                {tier.steps.map((step) => (
                  <span key={step.index} className={step.active ? 'tier-step active' : 'tier-step'}>
                    <span className="tier-track" aria-hidden="true">
                      <span style={{ width: `${step.fill * 100}%` }} />
                    </span>
                    <span className="tier-floor tabular">
                      {step.division > 0 && <b>{'I'.repeat(step.division)}</b>}
                      {formatNumber(step.floor, 0)}
                      {!step.division && ' pts'}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
