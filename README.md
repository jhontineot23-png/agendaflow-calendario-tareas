# AgendaFlow — Calendario de tareas para practicar Git

Aplicación web responsive desarrollada con **HTML, CSS y JavaScript nativo**, sin frameworks, paquetes npm, servidor ni APIs externas. Se abre directamente con `index.html`.

## Funciones

- Vista mensual con navegación a mes anterior/siguiente y acceso a hoy.
- Seleccionar un día para ver sus tareas.
- Crear tareas con título, descripción, fecha, hora y categoría.
- Editar las tareas existentes.
- Marcar tareas como completadas (se muestran tachadas) y volverlas a pendientes.
- Eliminar tareas con confirmación.
- Filtros de todas, pendientes y completadas.
- Resumen de tareas y porcentaje de progreso.
- Almacenamiento en `localStorage` del navegador.
- Mensaje de bienvenida en `js/config.js`, aislado deliberadamente para practicar un conflicto real.

> Los datos de tareas se guardan en el navegador del usuario. No se sincronizan entre computadoras por GitHub. Git versiona el código fuente, no el contenido de `localStorage`.

## Ejecutar localmente

1. Descomprime el ZIP.
2. Abre la carpeta `agenda-calendario-git`.
3. Haz doble clic en `index.html`.
4. Prueba crear, editar, completar y eliminar tareas.

No es necesario instalar nada. Si tu navegador restringe el almacenamiento para archivos locales, abre la carpeta con una extensión de servidor local estático; la aplicación sigue sin necesitar backend.

## Estructura

```text
agenda-calendario-git/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── config.js       # Texto de bienvenida para el conflicto
│   └── app.js          # Lógica del calendario y de las tareas
├── .gitignore
├── README.md
└── GUIA_RAPIDA_EXPOSICION.md
```

## Publicarlo en GitHub por primera vez

### 1. Crear un repositorio vacío

En GitHub, crea un repositorio llamado `agendaflow-calendario-tareas`. Para un trabajo de clase, puede ser público. Al crearlo, no inicialices README, `.gitignore` ni licencia: ya hay un README local.

### 2. Preparar el proyecto local

Abre una terminal en la carpeta donde están `index.html` y `README.md`, y ejecuta:

```bash
git --version
git init -b main
git add .
git commit -m "Crear AgendaFlow calendario de tareas"
```

Si Git te pide configurar identidad, utiliza el nombre y correo que quieras asociar a tus commits:

```bash
git config --global user.name "Tu nombre"
git config --global user.email "tu-correo@example.com"
```

Vuelve a ejecutar `git commit` después de configurar la identidad.

### 3. Conectar el remoto y publicar

Copia la URL HTTPS que GitHub muestra para el repositorio y reemplaza `TU-USUARIO` por tu usuario real:

```bash
git remote add origin https://github.com/TU-USUARIO/agendaflow-calendario-tareas.git
git push -u origin main
```

Si `origin` ya está configurado, comprueba con `git remote -v` en lugar de volver a agregarlo.

### 4. Permitir que tu compañero suba ramas

Clonar un repositorio público no da permiso para subir cambios al repositorio original. Como propietario, abre el repositorio en GitHub y entra a **Settings → Collaborators** (la etiqueta puede variar ligeramente). Invita a tu compañero por su usuario de GitHub. Tu compañero debe aceptar la invitación. Así ambos podrán publicar ramas en el mismo repositorio.

Si no deseas agregar colaboradores, la alternativa es que la otra persona haga un fork y proponga sus cambios con un pull request; para una demostración rápida, colaborar en el mismo repositorio es más sencillo.

## Clonación por tu compañero

Tu compañero abre una terminal en la carpeta donde guardará el proyecto (fuera de cualquier otra copia) y ejecuta:

```bash
git clone https://github.com/TU-USUARIO/agendaflow-calendario-tareas.git
cd agendaflow-calendario-tareas
git status
```

Debe sustituir `TU-USUARIO` por el propietario real del repositorio. Después abre el `index.html` de su copia. Tú debes mantener tu copia original en otra carpeta; no trabajen accidentalmente sobre el mismo directorio.

## Demostración de un conflicto real en el mensaje de bienvenida

**Objetivo:** los dos empiezan desde la misma versión de `js/config.js` y cambian la misma propiedad `welcomeMessage` con textos diferentes. Git no puede escoger automáticamente uno, por eso marcará un conflicto al fusionar las ramas.

### A. Desarrollador A — crear y subir su rama

En tu copia local, desde la rama `main` actualizada:

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/bienvenida-a
```

Abre `js/config.js`. Cambia solo el valor de `welcomeMessage` por este texto, conservando comas, comillas y llaves:

```js
welcomeMessage: "¡Hola desde A! AgendaFlow está listo para planificar el día.",
```

Guarda y publica el commit:

```bash
git add js/config.js
git commit -m "Personalizar bienvenida desde A"
git push -u origin feature/bienvenida-a
```

No integres todavía esta rama en `main`.

### B. Desarrollador B — crear una rama desde `main`

En la computadora del compañero, asegúrate de que la rama base sea `main`. Esto importa: no debe crear su rama basada en `feature/bienvenida-a`.

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/bienvenida-b
```

Abre `js/config.js` en su propia clonación y cambia **la misma línea** a un texto diferente:

```js
welcomeMessage: "¡Hola desde B! Organiza tus tareas y celebra cada avance.",
```

Guarda y publica:

```bash
git add js/config.js
git commit -m "Personalizar bienvenida desde B"
git push -u origin feature/bienvenida-b
```

### C. Desarrollador B — provocar el conflicto

Sin salir de la rama `feature/bienvenida-b`, ejecuta:

```bash
git fetch origin
git merge origin/feature/bienvenida-a
```

El segundo comando debe detenerse con un conflicto porque ambas ramas editaron la misma línea de manera distinta. Compruébalo con:

```bash
git status
```

Abre `js/config.js`. Git habrá colocado marcadores similares a estos (la posición exacta de A y B puede variar según la rama actual):

```text
<<<<<<< HEAD
welcomeMessage: "¡Hola desde B! Organiza tus tareas y celebra cada avance.",
=======
welcomeMessage: "¡Hola desde A! AgendaFlow está listo para planificar el día.",
>>>>>>> origin/feature/bienvenida-a
```

Explica que `HEAD` es la versión de la rama actual (`feature/bienvenida-b`), `=======` separa las dos versiones y la última línea marca la versión que se intenta integrar.

### D. Desarrollador B — resolver el conflicto

Elimina los marcadores y deja una única línea definitiva que combine la intención de ambos. Por ejemplo:

```js
welcomeMessage: "¡Bienvenidos a AgendaFlow! A y B trabajaron en equipo para planificar mejor el día.",
```

Asegúrate de no eliminar las llaves del objeto de configuración. Guarda y continúa:

```bash
git add js/config.js
git commit -m "Resolver conflicto de bienvenida entre A y B"
git push origin feature/bienvenida-b
```

Verifica el resultado abriendo la aplicación y recargando `index.html`. Para confirmar el historial:

```bash
git log --oneline --graph --decorate --all
```

### E. Integrar el resultado en `main`

Para una demo controlada, si nadie más ha modificado `main` durante el ejercicio, el compañero puede integrar la rama resuelta así:

```bash
git switch main
git pull --ff-only origin main
git merge --no-ff feature/bienvenida-b -m "Integrar bienvenida resuelta por el equipo"
git push origin main
```

Luego actualiza tu copia:

```bash
git switch main
git pull --ff-only origin main
```

Abre la aplicación y muestra que la bienvenida combinada quedó en `main`. La rama A sigue registrada y el historial muestra el trabajo en paralelo.

> Si `git pull --ff-only` avisa que las ramas divergieron, no fuerces ni borres nada: revisa `git status` y coordina con tu compañero antes de continuar. Esta guía presupone que `main` no cambió durante la práctica y que ambos tienen permiso para publicar ramas.

## Si algo sale mal

- **`git push` dice que no tienes permiso:** acepta la invitación de colaborador y verifica la URL del remoto con `git remote -v`.
- **No aparece conflicto:** comprueba que A y B partieron de `main`, editaron exactamente la misma propiedad y que B ejecutó `git merge origin/feature/bienvenida-a` desde `feature/bienvenida-b`.
- **Se quedó una fusión a medias y quieres cancelar:** ejecuta `git merge --abort` antes de hacer otros cambios, siempre que la fusión siga en curso.
- **Hay marcadores en el archivo:** no hagas commit hasta eliminar `<<<<<<<`, `=======` y `>>>>>>>` y dejar JavaScript válido.
- **La bienvenida no cambia al actualizar el código:** recarga la página y verifica que `index.html` cargue primero `js/config.js` y después `js/app.js`.
- **Las tareas de tu compañero no aparecen en tu computadora:** es normal. Se guardan en el `localStorage` de cada navegador; GitHub comparte el código, no esos datos locales.
