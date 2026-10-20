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

# Lo publicado tiene que ser un commit de main, para saber siempre qué hay
# en producción. En modo prueba sólo se avisa.
rama=$(git rev-parse --abbrev-ref HEAD)
sucio=$(git status --porcelain)
if [[ "$rama" != main || -n "$sucio" ]]; then
  mensaje="Estás en '$rama'$([[ -n "$sucio" ]] && echo ' con cambios sin commitear')."
  if [[ $PRUEBA -eq 1 ]]; then
    echo "⚠ $mensaje Para publicar de verdad tiene que ser main y sin cambios."
  else
    echo "✗ $mensaje Se publica sólo desde main, con todo commiteado." >&2
    exit 1
  fi
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
