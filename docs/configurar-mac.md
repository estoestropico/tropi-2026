# Configurar una Mac para trabajar en tropi-2026

Guía para dejar una Mac lista para trabajar en el sitio de Trópico en
paralelo con la PC: clonar el repo, commitear, pushear a GitHub y publicar en
Hostinger.

Está escrita para que **Claude Code la siga en la Mac guiando al usuario**,
pero también se puede seguir a mano.

## Cómo arrancar

El repo es privado y la Mac todavía no tiene acceso, así que esta guía llega
antes que el repo:

1. En la Mac, entrar a GitHub con la cuenta de Trópico (hola@tropico.ar) y
   abrir https://github.com/estoestropico/tropi-2026/blob/main/docs/configurar-mac.md
2. Botón **Download raw file** (ícono de descarga arriba a la derecha). Queda
   en `~/Downloads/configurar-mac.md`.
3. Abrir la Terminal, escribir `claude` y pedirle:
   > Seguí la guía `~/Downloads/configurar-mac.md` y guiame paso a paso.

---

## Instrucciones para Claude

Vas a configurar esta Mac paso a paso, junto con el usuario.

- Hablale en español y explicá cada paso en una o dos frases antes de hacerlo.
- Hacé vos todo lo que se pueda hacer desde la terminal. Lo que se hace en
  una página web (GitHub, hPanel) lo hace el usuario: dale el enlace exacto y
  lo que tiene que pegar, y **esperá a que confirme** antes de seguir.
- Antes de pasar al paso siguiente, corré la comprobación de cada paso. Si
  algo falla, resolvelo ahí; no sigas con un paso roto.
- No muestres ni pidas contraseñas. Las claves privadas (`~/.ssh/*` sin
  `.pub`) no se copian, no se muestran y no salen de la Mac.
- Antes de crear un archivo o agregar un bloque a `~/.ssh/config`, fijate si
  ya existe. No pises nada sin preguntar.
- Si algo de la Mac no coincide con lo que dice esta guía (otra versión,
  otra ruta), adaptalo y contale al usuario qué cambiaste.

### Datos fijos

| Qué | Valor |
|---|---|
| Repo | `estoestropico/tropi-2026` (privado), cuenta GitHub hola@tropico.ar |
| URL del repo | `git@github-tropico:estoestropico/tropi-2026.git` (alias SSH, igual en todas las máquinas) |
| Hosting | Hostinger, usuario `u922223883`, IP `45.152.44.145`, puerto `65002` |
| Carpeta publicada | `~/domains/tropico.ar/public_html` en el servidor |
| Node | 22 (está en `.nvmrc`) |

Cada máquina tiene **sus propias claves**: no se copian las de la PC. Así,
si se pierde una máquina, se borra sólo su clave en GitHub y en hPanel.

---

### Paso 1 — Herramientas

Hace falta: git, Homebrew, Node 22 y rsync 3.

```bash
xcode-select -p || xcode-select --install   # git viene con las Command Line Tools
command -v brew || echo "falta Homebrew"
node -v
rsync --version | head -1
```

- **Homebrew**, si falta: el instalador oficial de https://brew.sh pide la
  contraseña de la Mac. Pedile al usuario que lo corra él con `!` delante.
- **Node**: tiene que ser v22. Si falta o es otro: `brew install node@22` y
  seguir lo que diga brew para sumarlo al PATH.
- **rsync**: la Mac trae `openrsync`, que no tiene todas las opciones que usa
  `scripts/deploy.sh`. Instalar el de Homebrew: `brew install rsync`.

**Comprobación:** `node -v` empieza con `v22` y `rsync --version` dice
`rsync  version 3.` (con `which rsync` en `/opt/homebrew/bin`). Si sigue
apareciendo el del sistema, abrir una terminal nueva.

### Paso 2 — Clave de GitHub

```bash
ls ~/.ssh/id_ed25519_github_tropico 2>/dev/null && echo "ya existe"
ssh-keygen -t ed25519 -C "hola@tropico.ar (Mac)" -f ~/.ssh/id_ed25519_github_tropico
```

Recomendale al usuario ponerle una passphrase: en la Mac queda guardada en el
llavero y no la vuelve a pedir. `ssh-keygen` la pide de forma interactiva,
así que tiene que correrlo él con `!` delante.

Agregar a `~/.ssh/config` (crearlo si no existe, con permisos 600):

```
Host github-tropico
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_github_tropico
    IdentitiesOnly yes
    AddKeysToAgent yes
    UseKeychain yes
```

Copiar la clave pública al portapapeles con
`pbcopy < ~/.ssh/id_ed25519_github_tropico.pub`.

**El usuario**, con la sesión de hola@tropico.ar iniciada, entra a
https://github.com/settings/ssh/new, pone de título **Mac**, pega la clave y
guarda.

**Comprobación:** `ssh -T git@github-tropico` responde
`Hi estoestropico! You've successfully authenticated`.

### Paso 3 — Clonar el repo

Elegir dónde va, **fuera** de carpetas que se sincronizan solas (iCloud
Drive, Google Drive, Dropbox). Esas apps tocan los archivos de `.git` y
corrompen el repo. Ojo: si en la Mac está activo "Escritorio y Documentos en
iCloud", `~/Desktop` y `~/Documents` también se sincronizan. La opción segura
es `~/Proyectos`.

```bash
mkdir -p ~/Proyectos && cd ~/Proyectos
git clone git@github-tropico:estoestropico/tropi-2026.git
cd tropi-2026
```

Configurar el autor de los commits **sólo para este repo**. Preguntale al
usuario el nombre y el email con que quiere que aparezcan sus commits:

```bash
git config user.name "Nombre"
git config user.email "email@ejemplo.com"
```

**Comprobación:** `git status -sb` muestra `## main...origin/main` y
`ls src/assets` tiene las carpetas de imágenes.

### Paso 4 — Instalar y compilar

```bash
npm ci
npm run build
```

**Comprobación:** el build termina con
`✓ Integración del contacto verificada en dist/`.

### Paso 5 — La carpeta vieja "Tropico Nueva Web"

Hasta el 20/10/2026 el proyecto vivía en la carpeta "Tropico Nueva Web" de
la Mac, sin git. Desde ese día la fuente única es el repo. Antes de dejarla
de lado hay que asegurarse de que no tenga cambios que el repo no tenga.

Preguntale al usuario dónde está (o buscala con
`mdfind -name "Tropico Nueva Web"`) y compará:

```bash
diff -rq "RUTA/Tropico Nueva Web" ~/Proyectos/tropi-2026 \
  -x node_modules -x dist -x dist-previa -x .astro -x .git -x .DS_Store \
  -x _ref -x "Claude outputs" -x "*.zip"
```

- **Sin diferencias**, o sólo archivos que el `.gitignore` excluye: listo.
- **Con diferencias en `src/`, `public/`, `scripts/` o en la configuración**:
  mostráselas al usuario archivo por archivo y preguntale cuál versión vale.
  Lo que valga de la carpeta vieja se copia al repo, se revisa con
  `git diff`, se commitea y se pushea. No copies nada sin preguntar.

Cuando el repo tenga todo, proponé renombrar la carpeta vieja a
`Tropico Nueva Web (archivada, no usar)`. No la borres.

### Paso 6 — Clave de Hostinger (para publicar)

```bash
ls ~/.ssh/id_ed25519_hostinger_tropico 2>/dev/null && echo "ya existe"
ssh-keygen -t ed25519 -C "deploy tropico.ar (Mac)" -f ~/.ssh/id_ed25519_hostinger_tropico
```

Igual que en el paso 2, recomendá passphrase (la corre el usuario con `!`).

Agregar a `~/.ssh/config`:

```
Host hostinger-tropico
    HostName 45.152.44.145
    Port 65002
    User u922223883
    IdentityFile ~/.ssh/id_ed25519_hostinger_tropico
    IdentitiesOnly yes
    AddKeysToAgent yes
    UseKeychain yes
    LogLevel ERROR
```

`LogLevel ERROR` oculta un aviso de "post-quantum key exchange" que aparece
en cada conexión porque el servidor de Hostinger es viejo. No es un error.

Copiar la pública: `pbcopy < ~/.ssh/id_ed25519_hostinger_tropico.pub`.

**El usuario**, en hPanel (hosting de tropico.ar) → **Avanzado → Acceso
SSH**:

1. Activa el SSH si está desactivado.
2. En **Claves SSH → Agregar clave SSH**, pone de nombre **Mac** y pega la
   clave.

**Comprobación:** `ssh hostinger-tropico 'echo ok'` responde `ok`. La
primera vez pregunta si confiar en el servidor: es `45.152.44.145`, se
acepta. Si responde `/sbin/nologin`, la clave entró pero el SSH está
desactivado en hPanel.

### Paso 7 — Probar el deploy

Con el SSH todavía activo:

```bash
npm run deploy -- --dry-run
```

Compila y muestra qué subiría, sin subir nada. Si la Mac está al día con
GitHub y lo publicado es el último `main`, no lista ningún archivo.

Después, recordale al usuario **desactivar el SSH en hPanel**. Queda apagado
salvo cuando se publica.

### Paso 8 — Memoria de Claude en esta Mac

Lo que vale para todas las máquinas está en el `CLAUDE.md` del repo, que se
sincroniza solo con git. Guardá en tu memoria local de esta Mac sólo lo que
es de esta máquina:

- Ruta del repo en esta Mac y que la carpeta "Tropico Nueva Web" quedó
  archivada (o lo que se haya decidido en el paso 5).
- Que las claves de esta Mac son `~/.ssh/id_ed25519_github_tropico` y
  `~/.ssh/id_ed25519_hostinger_tropico`, con los alias `github-tropico` y
  `hostinger-tropico`, y si tienen passphrase en el llavero.
- Que rsync es el de Homebrew y Node es v22.
- El nombre y el email de git configurados para el repo.

### Paso 9 — Cierre

Repasá con el usuario:

- [ ] `ssh -T git@github-tropico` → `Hi estoestropico!`
- [ ] Repo clonado en `~/Proyectos/tropi-2026` (o donde se haya decidido),
      con nombre y email de git
- [ ] `npm run build` termina con `✓ Integración del contacto verificada`
- [ ] La carpeta vieja comparada y archivada
- [ ] `npm run deploy -- --dry-run` corrió bien con el SSH activo
- [ ] SSH desactivado otra vez en hPanel
- [ ] Memoria local guardada

Contale el flujo de trabajo diario, que está en la sección "Trabajar desde
varias máquinas" de `PROYECTO.md`, y borrá `~/Downloads/configurar-mac.md`:
de acá en más la guía está en `docs/` del repo.
