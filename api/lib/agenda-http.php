<?php
declare(strict_types=1);

// Funciones comunes de los endpoints de agenda que usa el agente de Prometheo (Prometheo Connect).

require __DIR__ . '/Agenda.php';
require __DIR__ . '/GoogleCalendar.php';
require __DIR__ . '/Prometheo.php';

// Carpeta privada, fuera de la raíz pública. En el hosting, ajustar esta ruta.
$dirPrivado = getenv('TROPI_PRIVADO') ?: '/opt/lampp/tropi-privado';
$config = require $dirPrivado . '/config.php';

// Respuesta JSON. Los resultados de negocio (sin lugar, datos faltantes) van con 200 y ok:false
// para que el agente lea el mensaje; los códigos de error quedan para fallas técnicas.
function responder(array $datos, int $codigo = 200): never
{
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function registrarAgenda(array $config, array $entrada): void
{
    $archivo = $config['dir_logs'] . '/agenda-' . date('Y-m') . '.log';
    file_put_contents($archivo, json_encode(['fecha' => date('c')] + $entrada, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
}

// Solo POST y con la clave que se carga en el header X-Api-Key de Prometheo Connect.
function autorizar(array $config): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Allow: POST');
        responder(['ok' => false, 'mensaje' => 'Método no permitido.'], 405);
    }
    $clave = $config['agenda']['clave_connect'] ?? '';
    if ($clave === '' || $clave === 'COMPLETAR_AQUI' || !hash_equals($clave, $_SERVER['HTTP_X_API_KEY'] ?? '')) {
        responder(['ok' => false, 'mensaje' => 'No autorizado.'], 401);
    }
}

// Cuerpo JSON o formulario. Las variables que el agente no completó llegan vacías o como "{{variable}}".
function entrada(): array
{
    $json = json_decode((string) file_get_contents('php://input'), true);
    $datos = is_array($json) ? $json : $_POST;
    $limpio = [];
    foreach ($datos as $clave => $valor) {
        $valor = is_scalar($valor) ? trim((string) $valor) : '';
        $limpio[$clave] = ($valor === '' || preg_match('/^\{\{.*\}\}$/', $valor)) ? null : $valor;
    }
    return $limpio;
}

function calendario(array $config): GoogleCalendar
{
    $g = $config['agenda']['google'];
    $token = is_file($g['archivo_token']) ? json_decode((string) file_get_contents($g['archivo_token']), true) : null;
    if (empty($token['refresh_token'])) {
        throw new RuntimeException('Falta autorizar la cuenta de Google (herramientas/google-autorizar.php).');
    }
    return new GoogleCalendar($g['client_id'], $g['client_secret'], $token['refresh_token'], $g['calendario'],
        $config['timeout'] + 2, $g['api_base'], $g['token_url']);
}

// "2026-10-14", "14/10" o "14/10/2026" → Y-m-d. Sin año: este año, o el próximo si la fecha ya pasó.
function normalizarFecha(?string $texto, DateTimeImmutable $hoy): ?string
{
    if ($texto === null) {
        return null;
    }
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $texto, $m)) {
        return checkdate((int) $m[2], (int) $m[3], (int) $m[1]) ? "$m[1]-$m[2]-$m[3]" : null;
    }
    if (preg_match('#^(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?$#', $texto, $m)) {
        $anio = isset($m[3]) ? (int) (strlen($m[3]) === 2 ? '20' . $m[3] : $m[3]) : (int) $hoy->format('Y');
        if (!checkdate((int) $m[2], (int) $m[1], $anio)) {
            return null;
        }
        $fecha = sprintf('%04d-%02d-%02d', $anio, $m[2], $m[1]);
        if (!isset($m[3]) && $fecha < $hoy->format('Y-m-d')) {
            $fecha = sprintf('%04d-%02d-%02d', $anio + 1, $m[2], $m[1]);
        }
        return $fecha;
    }
    return null;
}

function normalizarFranja(?string $texto): ?string
{
    $t = mb_strtolower((string) $texto);
    return match (true) {
        str_contains($t, 'ma') => 'manana',   // mañana, manana
        str_contains($t, 'tard') => 'tarde',
        default => null,
    };
}

// Inicio de la reunión: el ISO que devolvió la disponibilidad, o "14/10 10:00" / "2026-10-14 10:00".
function normalizarInicio(?string $texto, DateTimeZone $zona, DateTimeImmutable $hoy): ?DateTimeImmutable
{
    if ($texto === null) {
        return null;
    }
    if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/', $texto)) {
        try {
            return (new DateTimeImmutable($texto, $zona))->setTimezone($zona);
        } catch (Exception) {
            return null;
        }
    }
    if (preg_match('#^(\S+)\D+?(\d{1,2})[:.](\d{2})#', $texto, $m)) {
        $fecha = normalizarFecha($m[1], $hoy);
        return $fecha === null ? null
            : (new DateTimeImmutable($fecha, $zona))->setTime((int) $m[2], (int) $m[3]);
    }
    return null;
}
