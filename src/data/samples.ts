import { PedagogicalAnalysis } from '@/types/aliakit';

export interface SampleTask {
  id: string;
  title: string;
  category: string;
  sampleText: string;
  analysis: PedagogicalAnalysis;
}

export const SAMPLE_TASKS: SampleTask[] = [
  {
    id: 'math-sum',
    title: 'Matemática — Problema de lápices',
    category: 'Matemática',
    sampleText:
      'En una caja hay 12 lápices de colores. Lucas guarda 5 lápices más en la misma caja. ¿Cuántos lápices hay en total en la caja?',
    analysis: {
      detected_language: 'es',
      additional_languages: [],
      explanation_language: 'es-AR',
      subject: 'math',
      subject_label: 'Matemática',
      activity_type: 'solve_problem',
      activity_type_label: 'Resolver problema matemático',
      task_instruction: '¿Cuántos lápices hay en total en la caja?',
      simplified_instruction:
        'Tenés que averiguar cuántos lápices quedaron en la caja. Había 12 y Lucas agregó 5 lápices más.',
      steps: [
        'Anotá en tu hoja el número 12 (los lápices que ya estaban).',
        'Sumale los 5 lápices nuevos que guardó Lucas.',
        'Hacé la cuenta: 12 + 5.',
        'Escribí la respuesta completa: "En total hay 17 lápices".',
      ],
      difficult_terms: [
        {
          term: 'En total',
          explanation: 'La cantidad completa que te queda cuando juntás todo.',
        },
      ],
      uncertainties: [],
      needs_confirmation: false,
    },
  },
  {
    id: 'english-verbs',
    title: 'Inglés — Complete with verbs',
    category: 'Inglés',
    sampleText:
      'Complete the sentences with the correct verb:\n1. She ___ to school every day. (walk / walks)\n2. They ___ apples. (like / likes)',
    analysis: {
      detected_language: 'en',
      additional_languages: [],
      explanation_language: 'es-AR',
      subject: 'english',
      subject_label: 'Inglés',
      activity_type: 'complete_sentences',
      activity_type_label: 'Completar oraciones',
      task_instruction: 'Complete the sentences with the correct verb.',
      simplified_instruction:
        'Completá los espacios vacíos de las oraciones en inglés eligiendo la opción correcta entre paréntesis.',
      steps: [
        'Leé la primera oración: "She ___ to school every day".',
        'Mirá de quién habla: "She" significa "Ella". Con She, el verbo termina con una "s" (walks).',
        'Escribí "walks" en el primer renglón.',
        'Ahora leé la segunda oración: "They" significa "Ellos". Con They usamos "like" sin la "s".',
        'Escribí "like" en el segundo renglón.',
      ],
      difficult_terms: [
        {
          term: 'Verb (verbo)',
          explanation: 'Una palabra de acción, como caminar (walk) o gustar (like).',
        },
        {
          term: 'Sentences',
          explanation: 'Oraciones o frases completas.',
        },
      ],
      uncertainties: [],
      needs_confirmation: false,
    },
  },
  {
    id: 'language-fable',
    title: 'Lengua — Comprensión de lectura',
    category: 'Lengua',
    sampleText:
      'Leé el texto con atención y respondé en tu cuaderno:\n"La liebre se quedó dormida bajo un árbol porque creyó que era mucho más veloz. La tortuga siguió caminando despacito pero sin frenar, y cruzó la meta primero."\n1. ¿Quién ganó la carrera?\n2. ¿Por qué perdió la liebre?',
    analysis: {
      detected_language: 'es',
      additional_languages: [],
      explanation_language: 'es-AR',
      subject: 'language',
      subject_label: 'Lengua y Literatura',
      activity_type: 'reading_comprehension',
      activity_type_label: 'Preguntas de lectura',
      task_instruction: 'Respondé en tu cuaderno las 2 preguntas sobre la liebre y la tortuga.',
      simplified_instruction:
        'Leé el texto cortito y contestá las dos preguntas en tu cuaderno.',
      steps: [
        'Buscá en el texto quién llegó primera a la meta y escribí la respuesta 1.',
        'Fijate qué le pasó a la liebre (¿por qué se frenó?) y escribí la respuesta 2.',
        'Revisá que tus respuestas empiecen con mayúscula y terminen con punto.',
      ],
      difficult_terms: [
        {
          term: 'Veloz',
          explanation: 'Que corre muy rápido.',
        },
        {
          term: 'Meta',
          explanation: 'La línea final donde termina una carrera.',
        },
      ],
      uncertainties: [],
      needs_confirmation: false,
    },
  },
];
