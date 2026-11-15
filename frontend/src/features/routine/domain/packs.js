/**
 * Rotinas prontas para começar. Os nomes são os do catálogo (V4__catalogo_de_exercicios.sql);
 * séries, reps e descanso vêm de lá na hora de criar.
 */
export const PACKS = [
  {
    id: 'abc',
    name: 'ABC',
    description: '3 treinos alternados, cada grupo uma vez por ciclo. Bom para 3 a 6 dias na semana.',
    days: [
      {
        name: 'Peito, ombros e tríceps',
        exercises: [
          'Supino Reto com Barra',
          'Supino Inclinado com Halteres',
          'Crucifixo na Máquina',
          'Desenvolvimento com Halteres',
          'Elevação Lateral com Halteres',
          'Tríceps na Polia com Corda',
          'Tríceps Francês'
        ]
      },
      {
        name: 'Costas e bíceps',
        exercises: [
          'Puxada Frontal',
          'Remada Curvada com Barra',
          'Remada Baixa',
          'Pulldown com Corda',
          'Crucifixo Invertido na Máquina',
          'Rosca Direta com Barra',
          'Rosca Martelo'
        ]
      },
      {
        name: 'Pernas',
        exercises: [
          'Agachamento Livre',
          'Leg Press 45°',
          'Cadeira Extensora',
          'Stiff',
          'Mesa Flexora',
          'Elevação Pélvica',
          'Panturrilha em Pé'
        ]
      }
    ]
  },
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    description: 'Empurrar, puxar e pernas. Feito 2 vezes na semana, treina cada grupo 2 vezes.',
    days: [
      {
        name: 'Push',
        exercises: [
          'Supino Reto com Barra',
          'Supino Inclinado com Halteres',
          'Desenvolvimento com Halteres',
          'Elevação Lateral com Halteres',
          'Crossover',
          'Tríceps na Polia com Corda'
        ]
      },
      {
        name: 'Pull',
        exercises: [
          'Puxada Frontal',
          'Remada Curvada com Barra',
          'Remada Unilateral com Halter',
          'Face Pull',
          'Rosca Direta com Barra',
          'Rosca Martelo'
        ]
      },
      {
        name: 'Legs',
        exercises: [
          'Agachamento Livre',
          'Stiff',
          'Leg Press 45°',
          'Cadeira Flexora',
          'Cadeira Extensora',
          'Panturrilha Sentado'
        ]
      }
    ]
  },
  {
    id: 'upper-lower',
    name: 'Superior / Inferior',
    description: '2 treinos alternados. Em 4 dias na semana, cada metade do corpo treina 2 vezes.',
    days: [
      {
        name: 'Superior',
        exercises: [
          'Supino Reto com Halteres',
          'Remada Baixa',
          'Desenvolvimento com Halteres',
          'Puxada Frontal',
          'Elevação Lateral com Halteres',
          'Rosca Alternada com Halteres',
          'Tríceps na Polia com Barra'
        ]
      },
      {
        name: 'Inferior',
        exercises: [
          'Agachamento Livre',
          'Stiff',
          'Leg Press 45°',
          'Mesa Flexora',
          'Elevação Pélvica',
          'Panturrilha em Pé',
          'Abdominal Supra'
        ]
      }
    ]
  },
  {
    id: 'full-body',
    name: 'Corpo inteiro',
    description: '2 treinos de corpo todo, alternados. Para quem treina 2 ou 3 vezes na semana.',
    days: [
      {
        name: 'Corpo inteiro A',
        exercises: [
          'Agachamento Livre',
          'Supino Reto com Barra',
          'Remada Curvada com Barra',
          'Desenvolvimento com Halteres',
          'Rosca Direta com Barra',
          'Prancha'
        ]
      },
      {
        name: 'Corpo inteiro B',
        exercises: [
          'Levantamento Terra',
          'Supino Inclinado com Halteres',
          'Puxada Frontal',
          'Afundo',
          'Tríceps na Polia com Corda',
          'Abdominal Supra'
        ]
      }
    ]
  }
]
