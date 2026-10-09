<?php
declare(strict_types=1);

// Herramienta "reservar_reunion" del agente de Prometheo (Prometheo Connect).
// Entrada: inicio (el valor que devolvió consultar_disponibilidad), nombre, email; opcionales empresa y telefono.
// Crea el evento en Google Calendar con Meet e invita al lead (Google le manda la invitación por mail).
// Si llega el teléfono, ubica al lead en Prometheo y le asigna la etapa de reunión agendada.

require dirname(__DIR__) . '/lib/agenda-http.php';
require dirname(__DIR__) . '/lib/Contacto.php';

autorizar($config);
$cfg = $config['agenda'];
$agenda = new Agenda($cfg);
$zona = new DateTimeZone($cfg['zona']);
$datos = entrada();

$inicio = normalizarInicio($datos['inicio'] ?? null, $zona, $agenda->ahora());
$nombre = mb_substr((string) ($datos['nombre'] ?? ''), 0, 80);
$email = filter_var($datos['email'] ?? '', FILTER_VALIDATE_EMAIL) ?: null;
$empresa = mb_substr((string) ($datos['empresa'] ?? ''), 0, 80);
$telefono = $datos['telefono'] ?? null;

$faltan = array_keys(array_filter(['inicio' => $inicio === null, 'nombre' => $nombre === '', 'email' => $email === null]));
if ($faltan) {
    responder(['ok' => false, 'motivo' => 'datos_faltantes', 'faltan' => $faltan,
        'mensaje' => 'No se reservó. Falta o es inválido: ' . implode(', ', $faltan) . '. Pedíselo al lead y volvé a intentar.']);
}

$registro = ['accion' => 'reservar', 'inicio' => $inicio->format(DATE_RFC3339), 'email' => $email, 'telefono' => $telefono];
try {
    $cal = calendario($config);
    $fin = $agenda->fin($inicio);

    // Si el agente reintenta una reserva que ya se hizo, se devuelve la existente en lugar de duplicarla.
    foreach ($cal->buscarEventos($inicio, $fin, $email) as $ev) {
        if (isset($ev['start']['dateTime']) && new DateTimeImmutable($ev['start']['dateTime']) == $inicio) {
            $evento = $ev;
            $registro['resultado'] = 'ya_reservada';
            break;
        }
    }

    if (!isset($evento)) {
        [$desde, $hasta] = $agenda->rango();
        $ocupado = $cal->ocupado($desde, $hasta);
        $motivo = $agenda->validar($inicio, $ocupado);
        if ($motivo !== null) {
            $alternativas = $agenda->opciones($ocupado, $inicio->format('Y-m-d'))['opciones'];
            registrarAgenda($config, $registro + ['resultado' => $motivo]);
            responder(['ok' => false, 'motivo' => $motivo, 'opciones' => $alternativas,
                'mensaje' => ($motivo === 'ocupado' ? 'Ese horario ya no está disponible.' : 'Ese horario no está dentro de la agenda.')
                    . ($alternativas ? ' Alternativas: ' . implode('; ', array_column($alternativas, 'texto')) . '.' : '')
                    . ' No se reservó nada.']);
        }

        $quien = $empresa !== '' ? $empresa : $nombre;
        $evento = $cal->crearEvento([
            'summary'     => str_replace('{quien}', $quien, $cfg['titulo']),
            'description' => implode("\n", array_filter([
                $cfg['descripcion'],
                "Contacto: $nombre",
                $empresa !== '' ? "Empresa: $empresa" : null,
                $telefono !== null ? "WhatsApp: $telefono" : null,
            ])),
            'start'     => ['dateTime' => $inicio->format(DATE_RFC3339), 'timeZone' => $cfg['zona']],
            'end'       => ['dateTime' => $fin->format(DATE_RFC3339), 'timeZone' => $cfg['zona']],
            'attendees' => [['email' => $email, 'displayName' => $nombre]],
        ]);
        $registro['resultado'] = 'reservada';
    }
} catch (Throwable $e) {
    registrarAgenda($config, $registro + ['resultado' => 'error', 'error' => $e->getMessage()]);
    responder(['ok' => false, 'motivo' => 'error',
        'mensaje' => 'No se pudo confirmar la reunión en este momento. No le confirmes nada al lead y avisale que el equipo lo contacta.'], 502);
}

$meet = $evento['hangoutLink'] ?? null;
$texto = $agenda->texto($inicio);
$registro += ['evento_id' => $evento['id'] ?? null, 'meet' => $meet];

// Etapa y variables en Prometheo. Un error acá no afecta la reserva: queda en el registro.
if ($telefono !== null && $registro['resultado'] === 'reservada') {
    try {
        $normalizado = (new Contacto($config))->normalizarTelefono($telefono);
        $api = new Prometheo($config['api_key'], $config['api_base'], $config['timeout']);
        $lead = $normalizado !== null ? $api->buscarPorTelefono($normalizado) : null;
        if ($lead === null) {
            $registro['prometheo'] = 'lead no encontrado';
        } else {
            $cambios = ['smart_tags' => ['mode' => 'add', 'ids' => array_values(array_filter([$cfg['tag_reunion']]))]];
            $variables = array_filter([
                $cfg['variables']['fecha'] ?? '' => $texto,
                $cfg['variables']['link'] ?? '' => $meet,
            ], fn ($v, $k) => $k !== '' && $v !== null, ARRAY_FILTER_USE_BOTH);
            if ($variables) {
                $cambios['variables'] = $variables;
            }
            [$codigo, $resp] = $api->actualizarLead($lead['id'], $cambios);
            $registro['prometheo'] = $codigo === 200 ? "lead {$lead['id']} actualizado" : "error $codigo: " . ($resp['message'] ?? '');
        }
    } catch (Throwable $e) {
        $registro['prometheo'] = 'error: ' . $e->getMessage();
    }
}

registrarAgenda($config, $registro);
responder([
    'ok'        => true,
    'inicio'    => $inicio->format(DATE_RFC3339),
    'texto'     => $texto,
    'meet'      => $meet,
    'evento_id' => $evento['id'] ?? null,
    'mensaje'   => "Reunión confirmada para el $texto. Google le envió la invitación a $email"
        . ($meet ? " con el link de Google Meet: $meet" : '') . '.',
]);
