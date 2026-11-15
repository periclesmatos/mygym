// API pública da feature catalog: vocabulário de grupos musculares e busca no catálogo.
export { MuscleChips } from './components/MuscleChips'
export {
  EQUIPMENT,
  MUSCLE_GROUPS,
  exerciseGroup,
  muscleGroup,
  muscleGroups,
  normalizeText,
  totalSets
} from './domain/muscles'
export { findInCatalog, prepareCatalog, searchCatalog } from './domain/search'
