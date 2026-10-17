/**
 * ALIAKIT - Tipos de datos principales
 * MVP 1 - Aplicación educativa accesible para niños de 6 a 8 años
 */

export type StepId =
  | 'welcome'        // Paso 1: Bienvenida y llamada a la acción
  | 'capture'        // Paso 2: Cámara o subida de imagen
  | 'ocr_review'    // Paso 3: Revisión y corrección del texto extraído
  | 'analyzing'      // Paso 4: Estado de carga / análisis pedagógico
  | 'adapted_guide'  // Paso 5 & 6: Explicación adaptada, pasos y vocabulario
  | 'completed';     // Paso 8: Felicitación y opciones de cierre

export type SubjectId =
  | 'math'
  | 'language'
  | 'english'
  | 'natural_sciences'
  | 'social_sciences'
  | 'art'
  | 'history'
  | 'geography'
  | 'other';

export interface DifficultTerm {
  term: string;
  explanation: string;
}

/**
 * Esquema de salida estructurada del análisis pedagógico (Sección 6 del requerimiento)
 */
export interface PedagogicalAnalysis {
  detected_language: string;
  additional_languages: string[];
  explanation_language: string;
  subject: string;
  subject_label?: string;
  activity_type: string;
  activity_type_label?: string;
  task_instruction: string;
  simplified_instruction: string;
  steps: string[];
  difficult_terms: DifficultTerm[];
  uncertainties: string[];
  needs_confirmation: boolean;
}

export type FontSizeSetting = 'normal' | 'large' | 'xlarge';
export type ColorThemeSetting = 'warm' | 'cream' | 'white' | 'contrast';
export type SpacingSetting = 'normal' | 'relaxed' | 'loose';

export interface AccessibilitySettings {
  fontSize: FontSizeSetting;
  colorTheme: ColorThemeSetting;
  lineSpacing: SpacingSetting;
  letterSpacing: SpacingSetting;
  dyslexicFont: boolean;
  readingRuler: boolean;
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  playbackSpeed: number; // 0.75 | 1.0 | 1.25
  currentSegment: 'none' | 'original' | 'simplified' | 'steps';
  activeStepIndex?: number;
}
