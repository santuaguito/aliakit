# ALIAKIT — Tu compañero de tareas accesible

ALIAKIT es una aplicación web que ayuda a niños con dislexia o dificultades de lectoescritura a **entender sus tareas escolares**.

Alcanza con sacarle una foto a la hoja del cuaderno o del libro: la app lee la consigna, la explica con palabras simples en español rioplatense y la divide en pasos cortos, para que cada chico pueda resolverla por sí mismo. Además, todo se puede escuchar en voz alta.

🔗 **Probala acá:** [aliakit.vercel.app](https://aliakit.vercel.app/)

## ¿Qué hace?

- 📷 Lee la tarea a partir de una foto.
- 🤖 Interpreta la consigna con inteligencia artificial, sin inventar nada que no esté en la hoja.
- ✏️ Muestra el texto reconocido para que se pueda revisar y corregir.
- 📘 Arma una guía paso a paso, con lenguaje sencillo.
- 🔊 Lee la guía en voz alta.
- ♿ Incluye accesibilidad pensada para la dislexia: tipografía OpenDyslexic y espaciado ajustable entre letras y entre líneas.

## Tecnologías

Next.js · TypeScript · Tailwind CSS · Google Gemini · Piper TTS · Vercel

## Voz de Piper

La síntesis usa Piper con las voces `es_AR-daniela-high` y `en_GB-alba-medium`. Para desarrollo local, iniciá Piper en una terminal:

```sh
sh piper/start-local.sh
```

El script instala Piper en un entorno virtual local y descarga los modelos. También podés usar Docker Compose:

```sh
docker compose -f docker-compose.piper.yml up -d --build
```

En otra terminal, iniciá la app:

```sh
npm run dev
```

La primera ejecución local instala Piper y descarga los dos modelos; puede tardar unos minutos. La API de Next.js usa `http://127.0.0.1:5000` por defecto.

En Vercel, `vercel.json` declara la app Next.js y el servicio Piper como dos servicios del mismo proyecto. El enlace privado inyecta `PIPER_URL` en Next.js; el Dockerfile de producción incorpora las voces durante el build. Esto usa Vercel Services y Container Runtime, actualmente en beta. Para publicar, el proyecto Vercel debe tener habilitados estos servicios y recibir un nuevo deploy desde este repositorio.

Piper requiere un servicio de inferencia con los modelos `.onnx` instalados. Consultá las licencias de cada modelo antes de distribuirlo o usarlo comercialmente; el repositorio de Piper advierte que las licencias varían entre voces.

## Autor

Creado por **Santiago**.

---

<sub>ALIAKIT busca que cada chico pueda entender su tarea y resolverla por sí mismo.</sub>
