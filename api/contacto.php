<?php
declare(strict_types=1);

// Recibe el formulario de /contacto/ y registra el lead en Prometheo.
// Responde JSON al envío con fetch y redirige (303) al envío clásico sin JavaScript.

require __DIR__ . '/lib/Contacto.php';
require __DIR__ . '/lib/Prometheo.php';

// Carpeta privada, fuera de la raíz pública. En el hosting, ajustar esta ruta.
$dirPrivado = getenv('TROPI_PRIVADO') ?: '/opt/lampp/tropi-privado';
$config = require $dirPrivado . '/config.php';

$esFetch = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

function responder(bool $ok, string $mensaje, int $codigo = 200, array $errores = []): never
{
    global $esFetch;
    if ($esFetch) {
        http_response_code($codigo);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'mensaje' => $mensaje, 'errores' => $errores], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: ../contacto/?' . ($ok ? 'enviado=1' : 'error=' . $codigo), true, 303);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    responder(false, 'Método no permitido.', 405);
}

$contacto = new Contacto($config);
$gracias = '¡Gracias! Recibimos tu consulta y te vamos a escribir por WhatsApp a la brevedad.';

// A los bots se les responde como si todo hubiera salido bien.
if ($contacto->esSpam($_POST)) {
    $contacto->registrar(['resultado' => 'spam', 'ip' => $_SERVER['REMOTE_ADDR'] ?? '']);
    responder(true, $gracias);
}

[$datos, $errores] = $contacto->validar($_POST);
if ($errores) {
    responder(false, 'Revisá los datos marcados.', 422, $errores);
}

if (!$contacto->dentroDelLimite($_SERVER['REMOTE_ADDR'] ?? '')) {
    responder(false, 'Recibimos varios envíos seguidos. Probá de nuevo en un rato.', 429);
}

$variables = [$config['variables']['novedades'] => $datos['novedades'] ? 'Sí' : 'No'];
if ($datos['servicios']) {
    $variables[$config['variables']['servicio']] = implode(', ', $datos['servicios']);
}// Tags vacíos en la configuración no se envían.
$tagsServicios = array_values(array_filter(array_map(
    fn ($s) => $config['tags']['servicios'][$s] ?? '',
    $datos['servicios']
)));
$tagsBase = array_values(array_filter([$config['tags']['origen'], ...$tagsServicios]));

// El texto de la consulta no se envía a Prometheo: queda solo en el registro privado
// (más adelante se enviará por mail).
$registro = ['datos' => $datos];

try {
    $api = new Prometheo($config['api_key'], $config['api_base'], $config['timeout']);

    $lead = [
        'first_name'   => $datos['nombre'],
        'phone_number' => $datos['telefono'],
        'email'        => $datos['email'],
        'variables'    => $variables,
        'smart_tags'   => array_values(array_filter([...$tagsBase, $config['embudo']['etapa_entrada']])),
    ];
    if ($datos['apellido'] !== '') {
        $lead['last_name'] = $datos['apellido'];
    }

    [$codigo, $resp] = $api->crearLead($lead);

    // La API documenta 409 para teléfonos repetidos, pero en la práctica responde 500:
    // ante cualquiera de los dos se verifica si el lead ya existe.
    $existente = ($codigo === 409 || $codigo >= 500) ? $api->buscarPorTelefono($datos['telefono']) : null;

    if ($codigo === 201) {
        $registro += ['resultado' => 'creado', 'lead_id' => $resp['lead']['id'] ?? null];
    } elseif ($existente !== null) {
        // Lead existente: se actualizan sus datos sin tocar su etapa del embudo,
        // para no hacerlo retroceder si ya avanzó.
        $registro['alta_respondio'] = $codigo;
        // No marcar la casilla no es darse de baja: solo se actualiza si la marcó.
        if (!$datos['novedades']) {
            unset($variables[$config['variables']['novedades']]);
        }
        $cambios = [];
        if ($variables) {
            $cambios['variables'] = $variables;
        }
        if (empty($existente['email'])) {
            $cambios['email'] = $datos['email'];
        }
        if ($tagsBase) {
            $cambios['smart_tags'] = ['mode' => 'add', 'ids' => $tagsBase];
        }
        if ($cambios) {
            [$codigo, $resp] = $api->actualizarLead($existente['id'], $cambios);
            if ($codigo !== 200) {
                throw new RuntimeException("Actualización respondió $codigo: " . ($resp['message'] ?? ''));
            }
        }
        $registro += ['resultado' => 'actualizado', 'lead_id' => $existente['id']];
    } else {
        throw new RuntimeException("Alta respondió $codigo: " . ($resp['message'] ?? ''));
    }

    if (!empty($resp['rejected_fields'])) {
        $registro['rechazados'] = $resp['rejected_fields'];
    }

    // Bienvenida por WhatsApp: solo a leads nuevos que dieron su consentimiento.
    // Abre la conversación; cuando el lead responde, sigue el agente IA.
    $plantilla = $config['plantilla'];
    if ($plantilla['activa'] && $registro['resultado'] === 'creado' && $datos['acepta_whatsapp']) {
        $valores = [
            'nombre'   => $datos['nombre'],
            'servicio' => $datos['servicios'] ? implode(', ', $datos['servicios']) : $plantilla['servicio_defecto'],
        ];
        $parametros = array_map(fn ($campo) => $valores[$campo], $plantilla['parametros']);
        try {
            [$codigoPl, $respPl] = $api->enviarPlantilla($datos['telefono'], $plantilla['nombre'], $plantilla['idioma'], $parametros);
            $registro['plantilla'] = $codigoPl === 200 ? 'enviada' : "error $codigoPl: " . ($respPl['message'] ?? '');
        } catch (Throwable $e) {
            $registro['plantilla'] = 'error: ' . $e->getMessage();
        }
    }
} catch (Throwable $e) {
    // Si Prometheo falla, el contacto queda en el registro y el usuario ve el mensaje de éxito.
    $registro += ['resultado' => 'error', 'error' => $e->getMessage()];
}

$contacto->registrar($registro);
responder(true, $gracias);
