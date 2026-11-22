import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Regras de arquitetura do front, conferidas a cada `npm test` (o equivalente ao ModularityTest
 * do backend):
 * - uma feature só usa outra pelo index.js dela, e só as listadas em ALLOWED;
 * - shared/ não conhece nenhuma feature;
 * - domain/ é regra pura: sem React, sem API, sem UI.
 */
const ALLOWED = {
  auth: [],
  catalog: [],
  history: ['ranking'],
  home: ['catalog', 'ranking', 'routine', 'workout'],
  profile: ['auth', 'social'],
  progress: [],
  ranking: ['social'],
  routine: ['catalog'],
  social: [],
  workout: ['routine']
}

const SRC = fileURLToPath(new URL('.', import.meta.url))
const IMPORT = /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(js|jsx)$/.test(entry.name) && !entry.name.endsWith('.test.js') ? [path] : []
  })
}

const FILES = sourceFiles(SRC).map((path) => {
  const file = relative(SRC, path).split(sep).join('/')
  const imports = [...readFileSync(path, 'utf8').matchAll(IMPORT)].map((match) => match[1] || match[2])
  const [area, feature, layer] = file.split('/')
  return { file, imports, area, feature: area === 'features' ? feature : null, layer }
})

/** Import de outra feature: { name, deep } a partir de '@/features/<name>[/...]'. */
function featureImport(spec) {
  const match = spec.match(/^@\/features\/([^/]+)(\/.*)?$/)
  return match ? { name: match[1], deep: Boolean(match[2]) } : null
}

function violations(check) {
  return FILES.flatMap(({ file, imports, ...info }) =>
    imports.flatMap((spec) => {
      const problem = check(spec, info)
      return problem ? [`${file}: ${spec} (${problem})`] : []
    })
  )
}

describe('arquitetura', () => {
  it('toda feature está registrada em ALLOWED', () => {
    const features = readdirSync(join(SRC, 'features')).sort()
    expect(features).toEqual(Object.keys(ALLOWED).sort())
  })

  it('uma feature usa outra só pelo index e só se for permitido', () => {
    const found = violations((spec, { feature }) => {
      const target = featureImport(spec)
      if (!target || target.name === feature) return null
      if (target.deep) return 'importe pelo index da feature'
      if (feature && !ALLOWED[feature].includes(target.name)) return `${feature} não pode depender de ${target.name}`
      return null
    })
    expect(found).toEqual([])
  })

  it('dentro da feature, os arquivos não importam o próprio index', () => {
    const found = violations((spec, { feature }) => {
      const target = featureImport(spec)
      return target && target.name === feature && !target.deep ? 'use o caminho do arquivo' : null
    })
    expect(found).toEqual([])
  })

  it('shared não depende de features', () => {
    const found = violations((spec, { area }) =>
      area === 'shared' && featureImport(spec) ? 'shared é a base: não conhece features' : null
    )
    expect(found).toEqual([])
  })

  it('domain é regra pura, sem React, API nem UI', () => {
    const forbidden = [/^react/, /^@\/shared\/(api|ui|hooks)\//, /\/(pages|components|hooks|services)\//]
    const found = violations((spec, { layer }) =>
      layer === 'domain' && forbidden.some((pattern) => pattern.test(spec)) ? 'domain não conhece isso' : null
    )
    expect(found).toEqual([])
  })
})
