/** Um brasão por rank: moldura e símbolo próprios, com a divisão em marcas embaixo. */
const EMBLEMS = {
  frango: {
    frame: 'M32 5C45 5 57 22 57 37C57 52 46 59 32 59S7 52 7 37C7 22 19 5 32 5Z',
    body: 'M20 36a12 12 0 0 1 24 0v6H20ZM29 24c-1-6 6-9 7-2Z',
    cut: 'M25 32a2 2 0 1 0 4 0a2 2 0 1 0-4 0ZM35 32a2 2 0 1 0 4 0a2 2 0 1 0-4 0ZM28 37h8l-4 5Z'
  },
  projeto: {
    frame: 'M11 6H53L58 11V53L53 58H11L6 53V11Z',
    body: 'M16 34h15v10H16ZM33 34h15v10H33ZM24 22h15v10H24Z',
    cut: ''
  },
  focado: {
    frame: 'M32 4A28 28 0 1 1 31.9 4Z',
    body: 'M32 16A16 16 0 1 1 31.9 16Z',
    cut: 'M32 22A10 10 0 1 0 32.1 22ZM32 27A5 5 0 1 1 31.9 27Z'
  },
  maromba: {
    frame: 'M32 4L57 13V36C57 48 47 56 32 60C17 56 7 48 7 36V13Z',
    body: 'M14 22h6v20h-6ZM21 18h6v28h-6ZM37 18h6v28h-6ZM44 22h6v20h-6ZM27 29h10v6H27Z',
    cut: ''
  },
  casca: {
    frame: 'M32 3L57 17V47L32 61L7 47V17Z',
    body: 'M32 15L48 25L45 42L32 48L19 42L16 25Z',
    cut: 'M30.5 15h3v33h-3ZM17 27l15 6l15-6v3l-15 6l-15-6Z'
  },
  brabo: {
    frame: 'M8 9L20 4L32 9L44 4L56 9V36L32 61L8 36Z',
    body: 'M33 13c10 10 14 17 14 24c0 8-6 13-15 13s-15-5-15-13c0-6 3-11 7-14c0 4 2 7 5 7c3-5 4-11 4-17Z',
    cut: 'M32 34c5 4 6 12 0 13c-6-1-5-9 0-13Z'
  },
  monstro: {
    frame: 'M3 5L18 12H46L61 5L57 40L32 62L7 40Z',
    body: 'M12 15L23 23H41L52 15L48 36L40 49H24L16 36Z',
    cut: 'M21 29l9 4l-8 2ZM43 29l-9 4l8 2ZM25 41h14l-3 5l-4-3l-4 3Z'
  },
  mutante: {
    frame: 'M32 2L41 12L55 9L52 23L62 32L52 41L55 55L41 52L32 62L23 52L9 55L12 41L2 32L12 23L9 9L23 12Z',
    body: 'M36 11L18 35h11l-3 18l20-26H34Z',
    cut: ''
  },
  lenda: {
    frame: 'M1 12L18 15L32 2L46 15L63 12L55 42L32 62L9 42Z',
    body: 'M15 22l10 7l7-14l7 14l10-7l-5 22H20Z',
    cut: 'M32 30l5 6l-5 6l-5-6Z'
  }
}

export function RankBadge({ rank, size = 64, title }) {
  const art = EMBLEMS[rank.key] || EMBLEMS.frango
  const height = rank.division ? 76 : 64
  return (
    <svg
      className={`rank-badge rank-${rank.key}`}
      width={size}
      height={(size * height) / 64}
      viewBox={`0 0 64 ${height}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path className="rank-frame" d={art.frame} />
      <path className="rank-body" d={art.body} />
      {art.cut && <path className="rank-cut" d={art.cut} />}
      {rank.division > 0 &&
        [1, 2, 3].map((mark) => (
          <path
            key={mark}
            className={mark <= rank.division ? 'rank-mark on' : 'rank-mark'}
            d={`M${mark * 14 + 4} 65l5 5l-5 5l-5-5Z`}
          />
        ))}
    </svg>
  )
}
