# ALIAKIT — Tu compañero de tareas accesible

**MVP 1 — Aplicación educativa inteligente y accesible para niños de 6 a 8 años con dislexia o dificultades de lectoescritura.**

ALIAKIT transforma consignas de tareas fotografiadas en una experiencia accesible, guiada y paso a paso en **español rioplatense**, favoreciendo la autonomía del niño sin que la inteligencia artificial resuelva automáticamente la actividad por él.

---

## 1. Estado del Proyecto (Fases de Desarrollo)

| Fase | Descripción | Estado |
|---|---|---|
| **FASE 1** | **Estructura, diseño accesible, navegación e interfaz completa** |  **COMPLETA** |
| **FASE 2** | Reconocimiento de texto local mediante Tesseract.js | ⏳ *Pendiente de aprobación para iniciar* |
| **FASE 3** | Análisis pedagógico inteligente y adaptación con Google Gemini API | ⏳ *Pendiente* |
| **FASE 4** | Lectura en voz alta en español argentino con Azure AI Speech | ⏳ *Pendiente* |
| **FASE 5** | Verificación integral y pruebas multiformato | ⏳ *Pendiente* |
| **FASE 6** | Preparación para despliegue en Vercel | ⏳ *Pendiente* |

---

## 2. Tecnologías Utilizadas

- **Framework**: Next.js 15 (App Router).
- **Lenguaje**: TypeScript 5.
- **Estilos**: Tailwind CSS 4.
- **Iconografía**: Lucide React.
- **Accesibilidad**: Motor visual propio (regla de lectura, fondos cálidos antifatiga, tamaños de letra ampliados, interlineado y espaciado adaptado).
- **OCR (Fase 2)**: Tesseract.js (procesamiento 100% en el navegador del cliente).
- **IA Pedagógica (Fase 3)**: Google Gemini API (mediante endpoint backend seguro).
- **Síntesis de Voz (Fase 4)**: Azure AI Speech (voz en español de Argentina).
- **Plataforma de despliegue**: Vercel.

---

## 3. Principios de Accesibilidad y UX Infantil

1. **Diseño no sobreestimulante**: Paleta cálida (`#FBF8F2`), sin saturación de elementos, sin animaciones distractoras ni contrastes agresivos (evita el blanco puro deslumbrante).
2. **Español Rioplatense**: Frases cortas, claras y afectuosas (*"Vamos a entender tu tarea"*, *"Elegí una foto"*, *"Paso a paso"*, *"¡Muy bien!"*).
3. **Controles táctiles grandes**: Botones de al menos 56px de altura, fácilmente seleccionables en tablets y móviles.
4. **Herramientas de lectura en vivo**:
   - Ajuste rápido de tamaño de texto (Normal, Grande, Muy Grande).
   - Selector de fondo visual: Cálido (crema antifatiga), Blanco estándar o Alto contraste.
   - **Regla de lectura**: Barra visual de seguimiento que resalta el renglón activo para evitar saltos de línea al leer.
5. **Privacidad de menores**: No se requiere registro, ni cuentas, ni datos personales. Las fotografías no se almacenan permanentemente.

---

## 4. Requisitos Previos e Instalación

### Requisitos
- **Node.js**: v18.18+ o v20+ (probado en Node.js 25).
- **npm**: v9+ (o pnpm / yarn).

### Instalación de dependencias
```bash
# Dentro del directorio del proyecto
cd aliakit
npm install
```

---

## 5. Ejecución en Desarrollo Local

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en tu navegador para interactuar con la aplicación.

Para verificar compilación de producción:
```bash
npm run build
```

---

## 6. Configuración de Variables de Entorno

El proyecto incluye una plantilla `.env.example`. Las variables secretas se configuran localmente en `.env.local` (el cual está protegido en `.gitignore` para no subirse al repositorio):

```bash
cp .env.example .env.local
```

### Variables necesarias (Fases 3 y 4):
- `GEMINI_API_KEY`: Clave de Google Gemini API (para el endpoint backend seguro de análisis pedagógico).
- `AZURE_SPEECH_KEY`: Clave de Azure AI Speech (para síntesis de voz en español rioplatense).
- `AZURE_SPEECH_REGION`: Región de Azure (ej. `eastus`).

> **Importante:** En esta Fase 1 **no se requiere ninguna clave de API**. La interfaz y los ejemplos funcionan de forma completa y segura sin costo ni llamadas externas.

---

## 7. Pruebas y Verificación en la Fase 1

La aplicación incluye un botón para probar con **tareas de ejemplo reales**:
- **Matemática**: Problema de conteo y suma con vocabulario explicado (*"En total"*).
- **Inglés**: Ejercicio de completar oraciones con verbos (*"Complete the sentences..."*) con explicación en español rioplatense sin perder el objetivo pedagógico del idioma original.
- **Lengua y Literatura**: Comprensión lectora de fábulas con pasos guiados.

También podés cargar cualquier fotografía o captura de pantalla desde tu dispositivo para comprobar la vista previa, validaciones de tamaño y formato, el campo editable de revisión y el flujo completo.

---

## 8. Solución de Errores Habituales

- **La imagen es demasiado pesada**: ALIAKIT valida que las imágenes pesen menos de 10 MB. Sacar una foto con resolución estándar suele solucionar el inconveniente.
- **El texto de la tarea salió borroso**: La pantalla de captura incluye recordatorios sobre iluminación y estabilidad de la hoja antes de pasar a la revisión.
- **Permisos de cámara denegados**: Si el navegador bloquea la cámara, la opción *"Elegir una foto"* permite cargar cualquier archivo guardado o captura de pantalla.

---

## 9. Preparación para el Despliegue en Vercel (Fase 6)

1. En el panel de Vercel, vincular el repositorio.
2. Definir las variables de entorno en **Project Settings > Environment Variables** (`GEMINI_API_KEY`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`).
3. El despliegue se realiza automáticamente a través de la infraestructura serverless de Vercel (Next.js App Router).
