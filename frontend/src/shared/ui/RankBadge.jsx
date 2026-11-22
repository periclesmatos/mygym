/** Um brasão por rank: moldura e símbolo próprios, com a divisão em marcas embaixo. */
const EMBLEMS = {
  frango: {
    frame: 'M32 5C45 5 57 22 57 37C57 52 46 59 32 59S7 52 7 37C7 22 19 5 32 5Z',
    body: 'M20 36a12 12 0 0 1 24 0v6H20ZM29 24c-1-6 6-9 7-2Z',
    cut: 'M25 32a2 2 0 1 0 4 0a2 2 0 1 0-4 0ZM35 32a2 2 0 1 0 4 0a2 2 0 1 0-4 0ZM28 37h8l-4 5Z'
  },
  beta: {
    frame: 'M11 6H53L58 11V53L53 58H11L6 53V11Z',
    body: 'M21 54V23C21 16 25 12 31 12C38 12 43 16 43 22C43 26 41 29 38 30C43 32 45 35 45 39C45 46 39 50 32 50C30 50 28 49 27 48V54Z',
    cut: 'M27 23C27 19 29 17 31 17C35 17 37 19 37 23C37 26 34 28 31 28H27ZM27 33H32C36 33 39 35 39 39C39 43 36 45 32 45C30 45 28 44 27 43Z'
  },
  cria: {
    frame: 'M32 4A28 28 0 1 1 31.9 4Z',
    body: 'M13 37C12 25 19 17 29 17C38 17 43 23 45 31C50 31 55 34 57 39C49 40 41 41 33 41C25 41 18 40 13 37Z',
    cut: 'M13.5 34.5C24 37.5 34 36.5 45 31L45.5 33.5C35 39.5 24 40 13.5 37ZM24 24H31V27H29V31H26V27H24Z'
  },
  shapeado: {
    frame: 'M32 4L57 13V36C57 48 47 56 32 60C17 56 7 48 7 36V13Z',
    body: 'M27 13H37V18L49 21L53 30L48 32L44 28L39 49H25L20 28L16 32L11 30L15 21L27 18Z',
    cut: 'M31 22H33V45H31ZM24 26H30V28H25ZM34 26H40L39 28H34ZM27 34H30V36H27ZM34 34H37V36H34ZM27 40H30V42H27ZM34 40H37V42H34Z'
  },
  sigma: {
    frame: 'M32 3L57 17V47L32 61L7 47V17Z',
    body: 'M19 16H45V25H41L39 22H27L36 32L27 42H39L41 39H45V48H19V44L29 32L19 20Z',
    cut: ''
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
  jaula: {
    frame: 'M32 2L41 12L55 9L52 23L62 32L52 41L55 55L41 52L32 62L23 52L9 55L12 41L2 32L12 23L9 9L23 12Z',
    body: 'M14 14H50V18H14ZM14 46H50V50H14ZM15 18H19V46H15ZM45 18H49V46H45ZM27 18H31C31 25 25 26 25 32C25 38 31 39 31 46H27C27 41 21 39 21 32C21 25 27 23 27 18ZM33 18H37C37 23 43 25 43 32C43 39 37 41 37 46H33C33 39 39 38 39 32C39 26 33 25 33 18Z',
    cut: ''
  },
  goat: {
    frame: 'M1 12L18 15L32 2L46 15L63 12L55 42L32 62L9 42Z',
    body: 'M27 24C18 24 13 19 16 11C19 17 24 17 30 19L32 21L34 19C40 17 45 17 48 11C51 19 46 24 37 24L41 28L50 28L47 33L40 33L38 43L35 46L32 55L29 46L26 43L24 33L17 33L14 28L23 28Z',
    cut: 'M27 29L31 31L27 33ZM37 29L33 31L37 33ZM29 40H35L32 43Z'
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
