#!/usr/bin/env bash
# Publica el sitio en www.tropico.ar (Hostinger).
#
# Compila con `npm run build` (que incluye el chequeo del contacto) y
# sincroniza dist/ con public_html por rsync. No borra nada en el servidor:
# las carpetas ajenas (clientes, firma-mail, tropico-2026, _old, _bck, _new,
# backhtml) y tropi-privado/ quedan como están. Los _astro/ viejos tampoco
# se borran; no molestan.
#
# El .htaccess de la raíz nunca se pisa: si htaccess-produccion.txt cambió,
# avisa y hay que subirlo a mano (y nunca en 2026.tropico.ar).
#
# El SSH de Hostinger no queda encendido: se activa en hPanel → Avanzado →
# Acceso SSH antes de publicar y se desactiva al terminar.
#
# Requiere el alias `hostinger-tropico` en ~/.ssh/config.
#
# Uso: npm run deploy [-- --dry-run] [-- --sin-build]
#   --dry-run    muestra qué subiría, sin subir nada
#   --sin-build  usa el dist/ que ya está, sin volver a compilar
set -euo pipefail

HOST=hostinger-tropico
DESTINO=domains/tropico.ar/public_html

PRUEBA=0
COMPILAR=1
for arg in "$@"; do
  case "$arg" in
    --dry-run) PRUEBA=1 ;;
    --sin-build) COMPILAR=0 ;;
    *) echo "Opción desconocida: $arg" >&2; exit 1 ;;
  esac
done

cd "$(dirname "$0")/.."

# En modo prueba los problemas sólo se avisan; al publicar, cortan.
problema() {
  if [[ $PRUEBA -eq 1 ]]; then
    echo "⚠ $1 Para publicar de verdad hay que resolverlo."
  else
    echo "✗ $1" >&2
    exit 1
  fi
}

# Lo publicado tiene que ser un commit de main, para saber siempre qué hay
# en producción.
rama=$(git rev-parse --abbrev-ref HEAD)
[[ "$rama" == main ]] || problema "Estás en '$rama': se publica sólo desde main."
[[ -z "$(git status --porcelain)" ]] || problema "Hay cambios sin commitear."

# Se trabaja desde más de una máquina: si este main no es el de GitHub, se
# publicaría encima de lo que subió la otra.
git fetch -q origin main
local_=$(git rev-parse HEAD)
remoto=$(git rev-parse origin/main)
if [[ "$local_" != "$remoto" ]]; then
  if git merge-base --is-ancestor "$local_" "$remoto"; then
    problema "GitHub tiene commits que acá no están: hacer git pull."
  elif git merge-base --is-ancestor "$remoto" "$local_"; then
    problema "Hay commits sin subir a GitHub: hacer git push."
  else
    problema "main y origin/main se separaron: hacer git pull y resolver."
  fi
fi

if ! ssh -o ConnectTimeout=10 "$HOST" true 2>/dev/null; then
  echo "✗ No hay conexión SSH con Hostinger." >&2
  echo "  Activar el SSH en hPanel → Avanzado → Acceso SSH y volver a correr." >&2
  exit 1
fi

[[ $COMPILAR -eq 1 ]] && npm run build

if [[ ! -f dist/index.html ]]; then
  echo "✗ No hay build en dist/." >&2
  exit 1
fi

if ! ssh "$HOST" "cat $DESTINO/.htaccess" | cmp -s - dist/htaccess-produccion.txt; then
  echo "⚠ htaccess-produccion.txt no coincide con el .htaccess del servidor."
  echo "  No se sube solo: revisarlo y reemplazarlo a mano en public_html."
fi

# --checksum: cada build reescribe todos los archivos, así que la fecha no
# sirve para saber qué cambió. --chmod: varios archivos locales son 600 y el
# servidor web no los podría leer.
opciones=(-rlz --checksum --itemize-changes --no-perms --chmod=D755,F644
  --exclude=/.htaccess --exclude=/htaccess-produccion.txt --exclude=.DS_Store)
[[ $PRUEBA -eq 1 ]] && opciones+=(--dry-run)

rsync "${opciones[@]}" dist/ "$HOST:$DESTINO/"

if [[ $PRUEBA -eq 1 ]]; then
  echo "— Prueba: no se subió nada."
else
  echo "✓ Publicado $(git rev-parse --short HEAD) en www.tropico.ar"
fi
echo "→ Si ya terminaste, desactivá el SSH en hPanel → Avanzado → Acceso SSH."
