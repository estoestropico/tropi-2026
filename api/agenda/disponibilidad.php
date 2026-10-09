<?php
declare(strict_types=1);

// Herramienta "consultar_disponibilidad" del agente de Prometheo (Prometheo Connect).
// Entrada (opcional): fecha preferida (2026-10-14 o 14/10) y franja (mañana | tarde).
// Salida: hasta N horarios libres en el Google Calendar de la agenda, con texto listo para el chat.

require dirname(__DIR__) . '/lib/agenda-http.php';

autorizar($config);
$agenda = new Agenda($config['agenda']);
$datos = entrada();
$fecha = normalizarFecha($datos['fecha'] ?? null, $agenda->ahora());
$franja = normalizarFranja($datos['franja'] ?? null);

try {
    [$desde, $hasta] = $agenda->rango();
    $resultado = $agenda->opciones(calendario($config)->ocupado($desde, $hasta), $fecha, $franja);
} catch (Throwable $e) {
    registrarAgenda($config, ['accion' => 'disponibilidad', 'resultado' => 'error', 'error' => $e->getMessage()]);
    responder(['ok' => false, 'mensaje' => 'No se pudo consultar la agenda en este momento.'], 502);
}

$opciones = $resultado['opciones'];
if (!$opciones) {
    $mensaje = 'No hay horarios libres en los próximos días. Ofrecé que el equipo lo contacte para coordinar.';
} else {
    $lista = implode('; ', array_column($opciones, 'texto'));
    $mensaje = ($resultado['sin_preferencia'] ? 'No hay lugar en el día u horario pedido. ' : '')
        . "Horarios disponibles: $lista. Ofrecé estas opciones tal cual, sin inventar otras.";
}
registrarAgenda($config, ['accion' => 'disponibilidad', 'fecha_pedida' => $fecha, 'franja' => $franja,
    'opciones' => array_column($opciones, 'inicio')]);
responder(['ok' => (bool) $opciones, 'mensaje' => $mensaje] + $resultado);
