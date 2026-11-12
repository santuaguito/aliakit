'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, Lightbulb, RotateCcw, Sparkles } from 'lucide-react';
import TextToSpeechButton from './TextToSpeechButton';

type Choice = { text: string; correct: boolean };
type Question = {
  id: string;
  kind: 'choice' | 'sequence';
  prompt: string;
  hint: string;
  choices?: Choice[];
  answer?: string[];
  bank?: string[];
};
type Level = { id: number; title: string; instruction: string };

export const LEVELS_DATA: Level[] = [
  { id: 1, title: 'Discriminación de grafemas', instruction: 'Elegí la letra que completa la palabra.' },
  { id: 2, title: 'Conciencia de rimas', instruction: 'Buscá la palabra que termina con un sonido parecido.' },
  { id: 3, title: 'Detector de pseudopalabras', instruction: 'Encontrá la palabra inventada.' },
  { id: 4, title: 'Huecos mágicos', instruction: 'Elegí la sílaba que falta.' },
  { id: 5, title: 'Omisión de letras', instruction: 'Quitá la letra indicada y descubrí una nueva palabra.' },
  { id: 6, title: 'La Pirámide Mágica', instruction: 'Ordená las tarjetas de la palabra más larga a la más corta.' },
  { id: 7, title: 'El Mundo al Revés', instruction: 'Ordená las sílabas para formar una palabra.' },
  { id: 8, title: 'Las Orillas', instruction: 'Elegí la sílaba que completa la palabra.' },
  { id: 9, title: 'Oraciones descolocadas', instruction: 'Ordená las palabras para reconstruir la oración.' },
  { id: 10, title: 'La Palabra Prohibida', instruction: 'Elegí un artículo que complete correctamente la frase.' },
];

const choice = (id: string, prompt: string, hint: string, answers: string[], correct: number | number[] = 0): Question => {
  const correctIndexes = Array.isArray(correct) ? correct : [correct];
  return { id, kind: 'choice', prompt, hint, choices: answers.map((text, i) => ({ text, correct: correctIndexes.includes(i) })) };
};
const sequence = (id: string, prompt: string, hint: string, answer: string[], bank: string[] = answer): Question => ({ id, kind: 'sequence', prompt, hint, answer, bank });

/** Cada banco contiene diez variaciones. Los identificadores permiten evitar
 * repetir las preguntas de la ronda anterior cuando se vuelve a jugar. */
export const QUESTION_POOLS: Record<number, Question[]> = {
  1: [
    choice('g1-dedo', '¿Qué letra falta para formar “dedo”? _edo', '“Dedo” empieza con d.', ['d', 'b', 'p', 'q']),
    choice('g1-boca', '¿Qué letra falta para formar “boca”? _oca', '“Boca” empieza con b.', ['d', 'b', 'p', 'q'], 1),
    choice('g1-pato', '¿Qué letra falta para formar “pato”? _ato', '“Pato” empieza con p.', ['d', 'b', 'p', 'q'], 2),
    choice('g1-queso', '¿Qué letra falta para formar “queso”? _ueso', '“Queso” empieza con q.', ['d', 'b', 'p', 'q'], 3),
    choice('g1-bota', '¿Qué letra falta para formar “bota”? _ota', '“Bota” empieza con b.', ['d', 'b', 'p', 'q'], 1),
    choice('g1-dado', '¿Qué letra falta para formar “dado”? _ado', '“Dado” empieza con d.', ['d', 'b', 'p', 'q']),
    choice('g1-pelo', '¿Qué letra falta para formar “pelo”? _elo', '“Pelo” empieza con p.', ['d', 'b', 'p', 'q'], 2),
    choice('g1-quita', '¿Qué letra falta para formar “quita”? _uita', '“Quita” empieza con q.', ['d', 'b', 'p', 'q'], 3),
    choice('g1-beso', '¿Qué letra falta para formar “beso”? _eso', '“Beso” empieza con b.', ['d', 'b', 'p', 'q'], 1),
    choice('g1-pino', '¿Qué letra falta para formar “pino”? _ino', '“Pino” empieza con p.', ['d', 'b', 'p', 'q'], 2),
  ],
  2: [
    choice('r-casa', '¿Qué palabra rima con “casa”?', 'Escuchá el final: ca-sa.', ['taza', 'perro', 'sol']),
    choice('r-gato', '¿Qué palabra rima con “gato”?', 'Buscá otra palabra que termine en “ato”.', ['pato', 'mesa', 'luna']),
    choice('r-camion', '¿Qué palabra rima con “camión”?', 'Escuchá el sonido final “ón”.', ['avión', 'cama', 'dedo']),
    choice('r-flor', '¿Qué palabra rima con “flor”?', 'Buscá otra palabra que termine en “or”.', ['tambor', 'pato', 'nube']),
    choice('r-raton', '¿Qué palabra rima con “ratón”?', 'Escuchá el sonido final “ón”.', ['botón', 'gato', 'mesa']),
    choice('r-luna', '¿Qué palabra rima con “luna”?', 'Buscá otra palabra que termine en “una”.', ['cuna', 'sol', 'flor']),
    choice('r-pelota', '¿Qué palabra rima con “pelota”?', 'Escuchá el final “ota”.', ['gaviota', 'perro', 'casa']),
    choice('r-ventana', '¿Qué palabra rima con “ventana”?', 'Buscá otra palabra que termine en “ana”.', ['campana', 'camino', 'pez']),
    choice('r-leon', '¿Qué palabra rima con “león”?', 'Escuchá el sonido final “ón”.', ['melón', 'lápiz', 'nube']),
    choice('r-estrella', '¿Qué palabra rima con “estrella”?', 'Buscá otra palabra que termine en “ella”.', ['botella', 'gato', 'sol']),
  ],
  3: [
    choice('p-abuela', '¿Cuál es la palabra inventada?', '“Atuela” cambia un sonido de “abuela”.', ['Abuela', 'Atuela'], 1),
    choice('p-caballo', '¿Cuál es la palabra inventada?', '“Caballo” es una palabra conocida.', ['Caballo', 'Cabaño'], 1),
    choice('p-mariposa', '¿Cuál es la palabra inventada?', 'Escuchá cuál suena extraña: mariposa o maritosa.', ['Mariposa', 'Maritosa'], 1),
    choice('p-ventana', '¿Cuál es la palabra inventada?', '“Ventana” existe; la otra cambia un sonido.', ['Ventana', 'Ventama'], 1),
    choice('p-zapato', '¿Cuál es la palabra inventada?', 'Prestá atención a la consonante del medio.', ['Zapato', 'Zabato'], 1),
    choice('p-conejo', '¿Cuál es la palabra inventada?', 'Una de las dos cambia una letra.', ['Conejo', 'Comejo'], 1),
    choice('p-mochila', '¿Cuál es la palabra inventada?', '“Mochila” es una palabra conocida.', ['Mochila', 'Mochina'], 1),
    choice('p-tomate', '¿Cuál es la palabra inventada?', 'Buscá la palabra que cambia un sonido.', ['Tomate', 'Tobate'], 1),
    choice('p-cuchara', '¿Cuál es la palabra inventada?', '“Cuchara” existe; la otra cambia una letra.', ['Cuchara', 'Cuchala'], 1),
    choice('p-elefante', '¿Cuál es la palabra inventada?', 'Compará con cuidado las dos palabras.', ['Elefante', 'Erefante'], 1),
  ],
  4: [
    choice('h-pelota', 'PE ___ TA (pelota)', 'Decí despacio: pe-lo-ta.', ['LO', 'LA', 'TO']),
    choice('h-camino', 'CA ___ NO (camino)', 'Separá la palabra: ca-mi-no.', ['MI', 'MA', 'MO']),
    choice('h-maleta', 'MA ___ TA (maleta)', 'Separá la palabra: ma-le-ta.', ['LE', 'LA', 'TE']),
    choice('h-sapito', 'SA ___ TO (sapito)', 'Decí despacio: sa-pi-to.', ['PI', 'PA', 'PO']),
    choice('h-tomate', 'TO ___ TE (tomate)', 'Separá la palabra: to-ma-te.', ['MA', 'ME', 'MO']),
    choice('h-casita', 'CA ___ TA (casita)', 'Separá la palabra: ca-si-ta.', ['SI', 'SA', 'SO']),
    choice('h-molino', 'MO ___ NO (molino)', 'Decí despacio: mo-li-no.', ['LI', 'LO', 'LE']),
    choice('h-peludo', 'PE ___ DO (peludo)', 'Separá la palabra: pe-lu-do.', ['LU', 'LA', 'LO']),
    choice('h-paloma', 'PA ___ MA (paloma)', 'Decí despacio: pa-lo-ma.', ['LO', 'LA', 'LU']),
    choice('h-cunita', 'CU ___ TA (cunita)', 'Separá la palabra: cu-ni-ta.', ['NI', 'NA', 'NO']),
  ],
  5: [
    choice('o-plato', 'Si quitamos la L de “plato”, ¿qué palabra queda?', 'Quitá la L: P A T O.', ['pato', 'plato', 'palo']),
    choice('o-pasta', 'Si quitamos la S de “pasta”, ¿qué palabra queda?', 'Quitá la S y leé las letras restantes.', ['pata', 'pasta', 'pasa']),
    choice('o-carta', 'Si quitamos la R de “carta”, ¿qué palabra queda?', 'La palabra nueva empieza con C y termina en ATA.', ['cata', 'carta', 'cama']),
    choice('o-costa', 'Si quitamos la S de “costa”, ¿qué palabra queda?', 'Quitá la S: C O T A.', ['cota', 'costa', 'cosa']),
    choice('o-pasto', 'Si quitamos la S de “pasto”, ¿qué palabra queda?', 'Quitá la S y volvé a leer.', ['pato', 'pasto', 'palo']),
    choice('o-pinta', 'Si quitamos la N de “pinta”, ¿qué palabra queda?', 'Quitá la N: P I T A.', ['pita', 'pinta', 'pata']),
    choice('o-costo', 'Si quitamos la S de “costo”, ¿qué palabra queda?', 'Quitá la S y leé C O T O.', ['coto', 'costo', 'codo']),
    choice('o-lista', 'Si quitamos la S de “lista”, ¿qué palabra queda?', 'Quitá la S: L I T A.', ['lita', 'lista', 'lisa']),
    choice('o-pista', 'Si quitamos la S de “pista”, ¿qué palabra queda?', 'Quitá la S: P I T A.', ['pita', 'pista', 'pila']),
    choice('o-basta', 'Si quitamos la S de “basta”, ¿qué palabra queda?', 'Quitá la S y leé B A T A.', ['bata', 'basta', 'bota']),
  ],
  6: [
    sequence('m-plato', 'Ordená las tarjetas: plato, pato, ato.', 'Cada paso quita una letra y mantiene las demás en orden.', ['plato', 'pato', 'ato'], ['ato', 'plato', 'pato']),
    sequence('m-cadena', 'Ordená de más larga a más corta: cadena, cana, ana.', 'Buscá cuál palabra tiene más letras.', ['cadena', 'cana', 'ana'], ['ana', 'cadena', 'cana']),
    sequence('m-pelota', 'Ordená las tarjetas: pelota, pelo, elo.', 'La escalera empieza con la palabra más larga.', ['pelota', 'pelo', 'elo'], ['elo', 'pelota', 'pelo']),
    sequence('m-camino', 'Ordená las tarjetas: camino, cami, ami.', 'Contá las letras para encontrar el primer escalón.', ['camino', 'cami', 'ami'], ['ami', 'cami', 'camino']),
    sequence('m-molino', 'Ordená las tarjetas: molino, moli, oli.', 'La palabra más larga va primero.', ['molino', 'moli', 'oli'], ['oli', 'molino', 'moli']),
    sequence('m-paloma', 'Ordená las tarjetas: paloma, palo, alo.', 'Cada escalón tiene menos letras.', ['paloma', 'palo', 'alo'], ['alo', 'palo', 'paloma']),
    sequence('m-casita', 'Ordená las tarjetas: casita, casi, asi.', 'Empezá por la palabra que tiene seis letras.', ['casita', 'casi', 'asi'], ['asi', 'casita', 'casi']),
    sequence('m-maleta', 'Ordená las tarjetas: maleta, mala, ala.', 'Compará el largo de cada palabra.', ['maleta', 'mala', 'ala'], ['ala', 'mala', 'maleta']),
    sequence('m-tomate', 'Ordená las tarjetas: tomate, toma, oma.', 'La escalera baja de cantidad de letras.', ['tomate', 'toma', 'oma'], ['oma', 'tomate', 'toma']),
    sequence('m-camisa', 'Ordená las tarjetas: camisa, cama, ama.', 'Buscá la palabra más larga para comenzar.', ['camisa', 'cama', 'ama'], ['ama', 'camisa', 'cama']),
  ],
  7: [
    sequence('s-casa', '¿Qué palabra forman “sa” y “ca”?', 'Probá empezar con “ca”.', ['ca', 'sa'], ['sa', 'ca']),
    sequence('s-mesa', 'Ordená “sa”, “me” para formar una palabra.', 'La palabra donde comemos empieza con “me”.', ['me', 'sa'], ['sa', 'me']),
    sequence('s-pato', 'Ordená las sílabas “to”, “pa”.', 'El animal empieza con “pa”.', ['pa', 'to'], ['to', 'pa']),
    sequence('s-luna', 'Ordená las sílabas “na”, “lu”.', 'Mirá el cielo por la noche: empieza con “lu”.', ['lu', 'na'], ['na', 'lu']),
    sequence('s-gato', 'Ordená las sílabas “to”, “ga”.', 'El animal empieza con “ga”.', ['ga', 'to'], ['to', 'ga']),
    sequence('s-sapo', 'Ordená las sílabas “po”, “sa”.', 'El animal empieza con “sa”.', ['sa', 'po'], ['po', 'sa']),
    sequence('s-pelota', 'Ordená “ta”, “pe”, “lo”.', 'La palabra tiene tres sílabas: pe-lo-ta.', ['pe', 'lo', 'ta'], ['ta', 'pe', 'lo']),
    sequence('s-camino', 'Ordená “no”, “mi”, “ca”.', 'Un camino empieza con “ca”.', ['ca', 'mi', 'no'], ['no', 'mi', 'ca']),
    sequence('s-maleta', 'Ordená “ta”, “ma”, “le”.', 'Una valija también se llama maleta.', ['ma', 'le', 'ta'], ['ta', 'ma', 'le']),
    sequence('s-paloma', 'Ordená “ma”, “pa”, “lo”.', 'El ave empieza con “pa”.', ['pa', 'lo', 'ma'], ['ma', 'pa', 'lo']),
  ],
  8: [
    choice('e-cama', '¿Qué sílaba completa CA ___ para formar “cama”?', 'Separá la palabra: ca-ma.', ['ma', 'sa', 'pa']),
    choice('e-pato', '¿Qué sílaba completa PA ___ para formar “pato”?', 'Separá la palabra: pa-to.', ['to', 'ta', 'po']),
    choice('e-mesa', '¿Qué sílaba completa ME ___ para formar “mesa”?', 'Separá la palabra: me-sa.', ['sa', 'se', 'ma']),
    choice('e-luna', '¿Qué sílaba completa LU ___ para formar “luna”?', 'Separá la palabra: lu-na.', ['na', 'la', 'no']),
    choice('e-gato', '¿Qué sílaba completa GA ___ para formar “gato”?', 'Separá la palabra: ga-to.', ['to', 'ta', 'go']),
    choice('e-sapo', '¿Qué sílaba completa SA ___ para formar “sapo”?', 'Separá la palabra: sa-po.', ['po', 'pa', 'so']),
    choice('e-cuna', '¿Qué sílaba completa CU ___ para formar “cuna”?', 'Separá la palabra: cu-na.', ['na', 'ca', 'no']),
    choice('e-pelo', '¿Qué sílaba completa PE ___ para formar “pelo”?', 'Separá la palabra: pe-lo.', ['lo', 'la', 'po']),
    choice('e-mano', '¿Qué sílaba completa MA ___ para formar “mano”?', 'Separá la palabra: ma-no.', ['no', 'na', 'mo']),
    choice('e-rosa', '¿Qué sílaba completa RO ___ para formar “rosa”?', 'Separá la palabra: ro-sa.', ['sa', 'so', 'ra']),
  ],
  9: [
    sequence('o-gato', 'Ordená: “come / gato / El”.', 'Primero va quién hace la acción.', ['El', 'gato', 'come'], ['come', 'gato', 'El']),
    sequence('o-nina', 'Ordená: “lee / niña / La”.', 'La oración empieza con “La”.', ['La', 'niña', 'lee'], ['lee', 'niña', 'La']),
    sequence('o-perro', 'Ordená: “corre / perro / El”.', 'Primero nombramos al perro.', ['El', 'perro', 'corre'], ['corre', 'El', 'perro']),
    sequence('o-sol', 'Ordená: “brilla / sol / El”.', '¿Qué es lo que brilla?', ['El', 'sol', 'brilla'], ['brilla', 'sol', 'El']),
    sequence('o-abuela', 'Ordená: “canta / abuela / Mi”.', 'La oración empieza con “Mi”.', ['Mi', 'abuela', 'canta'], ['canta', 'Mi', 'abuela']),
    sequence('o-pajaros', 'Ordená: “vuelan / pájaros / Los”.', 'Primero van “Los pájaros”.', ['Los', 'pájaros', 'vuelan'], ['vuelan', 'pájaros', 'Los']),
    sequence('o-nene', 'Ordená: “juega / nene / El”.', '¿Quién juega? El nene.', ['El', 'nene', 'juega'], ['juega', 'El', 'nene']),
    sequence('o-mama', 'Ordená: “cocina / mamá / Mi”.', 'Primero nombramos a mamá.', ['Mi', 'mamá', 'cocina'], ['cocina', 'mamá', 'Mi']),
    sequence('o-flor', 'Ordená: “crece / flor / La”.', 'La oración empieza con “La”.', ['La', 'flor', 'crece'], ['crece', 'La', 'flor']),
    sequence('o-bebe', 'Ordená: “duerme / bebé / El”.', 'Primero nombramos al bebé.', ['El', 'bebé', 'duerme'], ['duerme', 'bebé', 'El']),
  ],
  10: [
    choice('a-estudiante', '___ estudiante llegó temprano.', '“Estudiante” puede usarse con el o la.', ['El', 'La'], [0, 1]),
    choice('a-artista', '___ artista saludó al público.', '“Artista” puede usarse con el o la.', ['El', 'La'], [0, 1]),
    choice('a-luna', '___ luna brilla de noche.', '“Luna” es una palabra femenina.', ['La', 'El', 'Los']),
    choice('a-gato', '___ gato duerme en el sillón.', '“Gato” es una palabra masculina.', ['El', 'La', 'Las']),
    choice('a-mano', '___ mano está limpia.', 'Aunque termina en O, “mano” es femenina.', ['La', 'El', 'Los']),
    choice('a-mapa', '___ mapa muestra el camino.', '“Mapa” es una palabra masculina.', ['El', 'La', 'Las']),
    choice('a-agua', '___ agua está fresca.', 'Se dice “el agua”, aunque agua es femenina.', ['El', 'La', 'Los']),
    choice('a-flor', '___ flor creció en el jardín.', '“Flor” es una palabra femenina.', ['La', 'El', 'Los']),
    choice('a-problema', '___ problema tiene solución.', '“Problema” es una palabra masculina.', ['El', 'La', 'Las']),
    choice('a-foto', '___ foto salió muy linda.', '“Foto” es una palabra femenina.', ['La', 'El', 'Los']),
  ],
};

const UNLOCKED_KEY = 'aliakit_dyslexia_unlocked_level';
const RECENT_KEY = 'aliakit_dyslexia_recent_questions';
const COMPLETED_KEY = 'aliakit_dyslexia_completed_levels';
const QUESTIONS_PER_ROUND = 3;

/** Fisher–Yates devuelve una copia mezclada y nunca altera el banco original. */
export function shuffleQuestions<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getRandomItems<T extends { id: string }>(pool: T[], count = QUESTIONS_PER_ROUND, excludedIds: string[] = []): T[] {
  const fresh = pool.filter((item) => !excludedIds.includes(item.id));
  const candidates = fresh.length >= count ? fresh : pool;
  return shuffleQuestions(candidates).slice(0, Math.min(count, candidates.length));
}

function playSoftRetrySound() {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 440;
    gain.gain.value = 0.035;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
    oscillator.onended = () => void context.close();
  } catch { /* El audio puede no estar disponible en el dispositivo. */ }
}

export default function DyslexiaGameModule({ onExit }: { onExit: () => void }) {
  const [unlocked, setUnlocked] = useState(1);
  const [levelId, setLevelId] = useState(1);
  const [currentLevelQuestions, setCurrentLevelQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selection, setSelection] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'hint' | null>(null);
  const [roundComplete, setRoundComplete] = useState(false);
  const [recentByLevel, setRecentByLevel] = useState<Record<number, string[]>>({});
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);

  const loadNewRound = useCallback((id: number, recent: Record<number, string[]> = recentByLevel) => {
    const questions = getRandomItems(QUESTION_POOLS[id], QUESTIONS_PER_ROUND, recent[id] || []);
    setCurrentLevelQuestions(questions);
    setQuestionIndex(0);
    setSelection([]);
    setFeedback(null);
    setRoundComplete(false);
    const nextRecent = { ...recent, [id]: questions.map((question) => question.id) };
    setRecentByLevel(nextRecent);
    localStorage.setItem(RECENT_KEY, JSON.stringify(nextRecent));
  }, [recentByLevel]);

  useEffect(() => {
    let savedRecent: Record<number, string[]> = {};
    let savedCompleted: number[] = [];
    let savedLevel = 1;
    try {
      const parsedLevel = Number(localStorage.getItem(UNLOCKED_KEY));
      if (parsedLevel >= 1 && parsedLevel <= LEVELS_DATA.length) savedLevel = parsedLevel;
      const parsedRecent = JSON.parse(localStorage.getItem(RECENT_KEY) || '{}');
      if (parsedRecent && typeof parsedRecent === 'object') savedRecent = parsedRecent;
      const parsedCompleted = JSON.parse(localStorage.getItem(COMPLETED_KEY) || '[]');
      if (Array.isArray(parsedCompleted)) savedCompleted = parsedCompleted.filter((id) => Number.isInteger(id) && id >= 1 && id <= LEVELS_DATA.length);
    } catch { /* Se continúa con el primer nivel si el almacenamiento está dañado. */ }
    setUnlocked(savedLevel);
    setLevelId(savedLevel);
    setRecentByLevel(savedRecent);
    setCompletedLevels(savedCompleted);
    loadNewRound(savedLevel, savedRecent);
    if (savedCompleted.length === LEVELS_DATA.length) setRoundComplete(true);
  // Solo inicializa el estado persistido al montar el juego.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const level = LEVELS_DATA[levelId - 1];
  const question = currentLevelQuestions[questionIndex];

  const finishQuestion = (success: boolean) => {
    if (!success) {
      setFeedback('hint');
      playSoftRetrySound();
      return;
    }
    setFeedback('correct');
  };

  const advanceQuestion = () => {
    setFeedback(null);
    setSelection([]);
    if (questionIndex + 1 < currentLevelQuestions.length) {
      setQuestionIndex((index) => index + 1);
      return;
    }
    setRoundComplete(true);
    const nextCompleted = completedLevels.includes(levelId)
      ? completedLevels
      : [...completedLevels, levelId].sort((a, b) => a - b);
    setCompletedLevels(nextCompleted);
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(nextCompleted));
    const nextUnlocked = Math.max(unlocked, Math.min(LEVELS_DATA.length, levelId + 1));
    setUnlocked(nextUnlocked);
    localStorage.setItem(UNLOCKED_KEY, String(nextUnlocked));
  };

  const chooseLevel = (id: number) => {
    if (id > unlocked) return;
    setLevelId(id);
    loadNewRound(id);
  };

  const replayWithNewQuestions = () => loadNewRound(levelId);
  const startNewGame = () => {
    setUnlocked(1);
    setLevelId(1);
    setCompletedLevels([]);
    localStorage.setItem(UNLOCKED_KEY, '1');
    localStorage.setItem(COMPLETED_KEY, '[]');
    loadNewRound(1);
  };
  const allLevelsCompleted = completedLevels.length === LEVELS_DATA.length;

  if (!level || !question && !roundComplete) return null;

  return <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10" aria-labelledby="game-title">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <button onClick={onExit} className="inline-flex min-h-12 items-center gap-2 rounded-2xl px-4 font-bold text-zinc-700 hover:bg-amber-100 focus:ring-4 focus:ring-amber-200"><ArrowLeft className="h-5 w-5"/>Volver</button>
      <p className="font-bold text-amber-900">Niveles desbloqueados: {unlocked} de 10</p>
    </div>

    <section className="rounded-[2rem] border-2 border-amber-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div><p className="mb-1 font-bold text-violet-700">Nivel {level.id} de 10 · Pregunta {roundComplete ? QUESTIONS_PER_ROUND : questionIndex + 1} de {QUESTIONS_PER_ROUND}</p><h1 id="game-title" className="text-2xl font-black text-amber-950 sm:text-3xl">{roundComplete ? '¡Nivel completado!' : level.title}</h1></div>
        <Sparkles className="h-8 w-8 shrink-0 text-amber-400"/>
      </div>

      {roundComplete ? <div className="rounded-3xl bg-emerald-50 p-5 sm:p-7" role="status">
        <p className="mb-4 text-lg font-bold text-emerald-950">{allLevelsCompleted ? '¡Completaste los 10 niveles! Ya podés empezar una nueva vuelta.' : '¡Terminaste esta ronda! ¿Querés practicar con palabras nuevas?'}</p>
        <div className="flex flex-wrap gap-3">
          {allLevelsCompleted ? <button onClick={startNewGame} className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-violet-600 px-5 font-black text-white hover:bg-violet-700"><RotateCcw className="h-5 w-5"/>Volver a jugar</button> : <>
            <button onClick={replayWithNewQuestions} className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-violet-600 px-5 font-black text-white hover:bg-violet-700"><RotateCcw className="h-5 w-5"/>Jugar de nuevo (Nuevas palabras)</button>
            {levelId < LEVELS_DATA.length && <button onClick={() => chooseLevel(levelId + 1)} className="min-h-14 rounded-2xl bg-emerald-600 px-5 font-black text-white hover:bg-emerald-700">Ir al nivel {levelId + 1}</button>}
          </>}
        </div>
      </div> : question && <>
        <div className="mb-6 rounded-3xl bg-sky-50 p-5 sm:p-7">
          <p className="mb-2 font-bold text-sky-900">{level.instruction}</p>
          <p className="text-xl font-black text-zinc-900 sm:text-2xl">{question.prompt}</p>
          <div className="mt-4"><TextToSpeechButton text={`${level.title}. ${level.instruction} ${question.prompt}`} label="Escuchar consigna"/></div>
        </div>

        {question.kind === 'choice' ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{question.choices?.map((item, index) => <div key={`${question.id}-${index}`} className="flex min-h-16 items-stretch gap-2"><button onClick={() => finishQuestion(item.correct)} className="min-h-16 flex-1 rounded-2xl border-2 border-violet-200 bg-violet-50 px-5 py-4 text-xl font-black text-violet-950 hover:border-violet-400 hover:bg-violet-100 focus:outline-none focus:ring-4 focus:ring-violet-200">{item.text}</button><TextToSpeechButton text={item.text} label="Escuchar palabra"/></div>)}</div> : <div>
          <div className="mb-3"><TextToSpeechButton text={question.bank?.join('… ') || ''} label="Escuchar tarjetas"/></div>
          <div className="mb-4 flex min-h-16 flex-wrap gap-2 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50 p-3" aria-label="Tu respuesta">{selection.map((item, index) => <button key={`${item}-${index}`} onClick={() => setSelection(selection.filter((_, i) => i !== index))} className="rounded-xl bg-white px-4 py-2 text-lg font-black text-sky-950 shadow">{item} ×</button>)}</div>
          <div className="flex flex-wrap gap-3">{question.bank?.filter((item) => !selection.includes(item)).map((item) => <button key={item} onClick={() => setSelection([...selection, item])} className="min-h-14 rounded-2xl border-2 border-violet-200 bg-violet-50 px-5 text-lg font-black text-violet-950">{item}</button>)}</div>
          <button onClick={() => finishQuestion(JSON.stringify(selection) === JSON.stringify(question.answer))} disabled={selection.length !== question.answer?.length} className="mt-5 min-h-14 rounded-2xl bg-violet-600 px-6 font-black text-white disabled:opacity-50">Comprobar respuesta</button>
        </div>}

        {feedback === 'hint' && <div className="mt-5 flex items-start gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-amber-950" role="status"><Lightbulb className="mt-1 h-6 w-6 shrink-0 text-amber-600"/><div className="flex-1"><p className="font-black">¡Probemos otra vez!</p><p>{question.hint}</p><div className="mt-2 flex flex-wrap gap-2"><TextToSpeechButton text={question.hint} label="Escuchar pista"/><button onClick={advanceQuestion} className="min-h-12 rounded-2xl bg-amber-500 px-4 font-black text-amber-950">Seguir a la próxima pregunta</button></div></div></div>}
        {feedback === 'correct' && <div className="mt-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-emerald-950" role="status"><p className="flex items-center gap-2 text-lg font-black"><Check className="h-6 w-6"/>¡Muy bien! Podés seguir cuando quieras.</p><button onClick={advanceQuestion} className="mt-3 min-h-12 rounded-2xl bg-emerald-600 px-5 font-black text-white">{questionIndex + 1 < currentLevelQuestions.length ? 'Siguiente pregunta' : 'Completar nivel'}</button></div>}
      </>}

      <nav className="mt-8 border-t border-zinc-100 pt-5" aria-label="Elegir nivel"><h2 className="mb-3 font-black text-zinc-800">Mis niveles</h2><div className="flex flex-wrap gap-2">{LEVELS_DATA.map(({id}) => <button key={id} disabled={id > unlocked} onClick={() => chooseLevel(id)} aria-label={`Nivel ${id}${id > unlocked ? ', bloqueado' : completedLevels.includes(id) ? ', completado' : ', disponible'}`} aria-current={id === levelId ? 'step' : undefined} className={`h-11 w-11 rounded-xl border-2 font-black ${id === levelId ? 'border-amber-500 bg-amber-300 text-amber-950' : completedLevels.includes(id) ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : id <= unlocked ? 'border-sky-200 bg-sky-50 text-sky-900' : 'border-zinc-200 bg-zinc-100 text-zinc-400'}`}>{id}</button>)}</div></nav>
    </section>
  </main>;
}
