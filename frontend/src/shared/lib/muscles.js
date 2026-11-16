/** Grupos na grafia e na ordem que o app usa (iguais aos do backend). */
export const MUSCLE_GROUPS = [
  'Peito',
  'Costas',
  'Ombros',
  'Trapézio',
  'Bíceps',
  'Tríceps',
  'Antebraço',
  'Quadríceps',
  'Posterior',
  'Glúteos',
  'Adutores',
  'Panturrilha',
  'Abdômen',
  'Cardio'
]

export const EQUIPMENT = [
  'Barra',
  'Halteres',
  'Máquina',
  'Polia',
  'Smith',
  'Peso corporal',
  'Kettlebell',
  'Elástico',
  'Outro'
]

/**
 * Grupo muscular deduzido pelo nome, para exercícios salvos sem grupo (os antigos).
 * A regra é por palavra-chave; a primeira que casar vence, por isso as
 * mais específicas vêm antes ("supino fechado" é tríceps, "rosca punho" é antebraço).
 */
const RULES = [
  ['Adutores', ['adutora', 'aducao', 'adutor']],
  ['Glúteos', ['gluteo', 'elevacao pelvica', 'hip thrust', 'abducao', 'abdutora', 'coice gluteo', 'ponte']],
  ['Antebraço', ['antebraco', 'rosca punho', 'punho']],
  [
    'Ombros',
    [
      'elevacao lateral',
      'elevacao frontal',
      'desenvolvimento',
      'crucifixo invertido',
      'crucifixo inverso',
      'face pull',
      'remada alta',
      'arnold',
      'deltoide',
      'ombro',
      'peck deck invertido',
      'voador invertido'
    ]
  ],
  [
    'Tríceps',
    ['triceps', 'frances', 'francesa', 'testa', 'mergulho', 'paralela', 'coice', 'pulley corda', 'supino fechado']
  ],
  ['Bíceps', ['biceps', 'rosca', 'scott', 'martelo']],
  [
    'Peito',
    [
      'supino',
      'crossover',
      'cross over',
      'crucifixo',
      'crussifixo',
      'cruxifixo',
      'peck deck',
      'voador',
      'flexao',
      'peito',
      'fly',
      'chest'
    ]
  ],
  [
    'Costas',
    [
      'remada',
      'puxada',
      'pulldown',
      'pull down',
      'barra fixa',
      'pull up',
      'pullover',
      'serrote',
      'levantamento terra',
      'terra',
      'costas',
      'dorsal',
      'lombar',
      'hiperextensao'
    ]
  ],
  ['Posterior', ['stiff', 'flexora', 'mesa flexora', 'cadeira flexora', 'rdl', 'bom dia', 'good morning', 'posterior']],
  ['Panturrilha', ['panturrilha', 'gemeos', 'soleo', 'calf']],
  [
    'Quadríceps',
    [
      'agachamento',
      'leg press',
      'legpress',
      'extensora',
      'cadeira extensora',
      'hack',
      'afundo',
      'passada',
      'bulgaro',
      'avanco',
      'sissy',
      'quadriceps'
    ]
  ],
  ['Abdômen', ['abdominal', 'abdomen', 'prancha', 'crunch', 'infra', 'obliquo', 'core', 'roda abdominal']],
  ['Trapézio', ['encolhimento', 'trapezio', 'shrug']],
  [
    'Cardio',
    ['esteira', 'bicicleta', 'bike', 'eliptico', 'escada', 'corrida', 'remo ergometro', 'cardio', 'pular corda', 'hiit']
  ]
]

/** Minúsculo, sem acento e só com letras e números separados por espaço. */
export function normalizeText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const COMPILED = RULES.map(([group, keys]) => [group, keys.map((key) => new RegExp(`(^| )${normalizeText(key)}( |$)`))])

/** Grupo de um exercício pelo nome, ou null quando não reconhece. */
export function muscleGroup(name) {
  const text = normalizeText(name)
  if (!text) return null
  for (const [group, patterns] of COMPILED) {
    if (patterns.some((pattern) => pattern.test(text))) return group
  }
  return null
}

/** Grupo salvo no exercício ou, sem ele, o deduzido pelo nome. */
export function exerciseGroup(exercise) {
  return exercise?.muscleGroup || muscleGroup(exercise?.name)
}

/** Grupos de uma lista de exercícios, do que tem mais séries para o que tem menos. */
export function muscleGroups(exercises) {
  const sets = new Map()
  const order = []
  for (const exercise of exercises || []) {
    const group = exerciseGroup(exercise)
    if (!group) continue
    if (!sets.has(group)) order.push(group)
    sets.set(group, (sets.get(group) || 0) + (Number(exercise.plannedSets) || 1))
  }
  return order.sort((a, b) => sets.get(b) - sets.get(a) || order.indexOf(a) - order.indexOf(b))
}

/** Soma das séries planejadas. */
export function totalSets(exercises) {
  return (exercises || []).reduce((sum, exercise) => sum + (Number(exercise.plannedSets) || 0), 0)
}
