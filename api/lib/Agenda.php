<?php
declare(strict_types=1);

// Reglas de la agenda: horarios disponibles a partir de lo ocupado en el calendario.
// No habla con Google: recibe los intervalos ocupados y devuelve horarios libres.
final class Agenda
{
    private const DIAS = [1 => 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

    private DateTimeZone $zona;

    public function __construct(private array $config)
    {
        $this->zona = new DateTimeZone($config['zona']);
    }

    public function ahora(): DateTimeImmutable
    {
        return new DateTimeImmutable('now', $this->zona);
    }

    /** Rango a consultar en el calendario: desde ahora hasta el último día de búsqueda. */
    public function rango(): array
    {
        $desde = $this->ahora();
        return [$desde, $desde->modify('+' . $this->config['dias_busqueda'] . ' days')->setTime(23, 59)];
    }

    /**
     * Elige hasta N opciones repartidas en días distintos, alternando mañana y tarde.
     * $fecha (Y-m-d) limita a ese día; $franja ('manana'|'tarde') filtra por horario.
     * Si la preferencia no tiene lugar, se ignora y se informa en 'sin_preferencia'.
     */
    public function opciones(array $ocupado, ?string $fecha = null, ?string $franja = null): array
    {
        $libres = $this->libres($ocupado);
        $filtrados = array_values(array_filter($libres, fn ($t) =>
            ($fecha === null || $t->format('Y-m-d') === $fecha) && ($franja === null || $this->franja($t) === $franja)));
        $sinPreferencia = ($fecha !== null || $franja !== null) && !$filtrados;
        $base = $sinPreferencia ? $libres : $filtrados;

        $n = $this->config['opciones'];
        if ($fecha !== null && !$sinPreferencia) {
            // Un solo día pedido: primero, medio y último horario de ese día.
            $elegidos = count($base) <= $n ? $base
                : array_map(fn ($i) => $base[(int) round($i * (count($base) - 1) / ($n - 1))], range(0, $n - 1));
        } else {
            $porDia = [];
            foreach ($base as $t) {
                $porDia[$t->format('Y-m-d')][] = $t;
            }
            $elegidos = [];
            foreach (array_values($porDia) as $i => $delDia) {
                $preferida = $franja ?? ($i % 2 === 0 ? 'manana' : 'tarde');
                $match = array_values(array_filter($delDia, fn ($t) => $this->franja($t) === $preferida));
                $elegidos[] = $match[0] ?? $delDia[0];
                if (count($elegidos) === $n) {
                    break;
                }
            }
        }
        return [
            'opciones'        => array_map(fn ($t) => ['inicio' => $t->format(DATE_RFC3339), 'texto' => $this->texto($t)], $elegidos),
            'sin_preferencia' => $sinPreferencia,
        ];
    }

    /** null si el horario es reservable; si no, el motivo. */
    public function validar(DateTimeImmutable $inicio, array $ocupado): ?string
    {
        $inicio = $inicio->setTimezone($this->zona);
        foreach ($this->libres($ocupado) as $t) {
            if ($t == $inicio) {
                return null;
            }
        }
        foreach ($this->libres([]) as $t) {
            if ($t == $inicio) {
                return 'ocupado';
            }
        }
        return 'fuera_de_agenda';
    }

    public function fin(DateTimeImmutable $inicio): DateTimeImmutable
    {
        return $inicio->modify('+' . $this->config['duracion'] . ' minutes');
    }

    public function texto(DateTimeImmutable $t): string
    {
        $t = $t->setTimezone($this->zona);
        return self::DIAS[(int) $t->format('N')] . ' ' . $t->format('d/m') . ' a las ' . $t->format('H:i') . ' h';
    }

    /** @return list<DateTimeImmutable> todos los inicios libres dentro de la ventana de búsqueda */
    private function libres(array $ocupado): array
    {
        $c = $this->config;
        $paso = $c['paso_minutos'];
        $minimo = $this->ahora()->modify('+' . $c['anticipacion_horas'] . ' hours');
        $descanso = $c['descanso'] * 60;
        $libres = [];
        for ($d = 0; $d <= $c['dias_busqueda']; $d++) {
            $dia = $this->ahora()->setTime(0, 0)->modify("+$d days");
            if (in_array($dia->format('Y-m-d'), $c['feriados'], true)) {
                continue;
            }
            foreach ($c['franjas'][(int) $dia->format('N')] ?? [] as [$desde, $hasta]) {
                [$h, $m] = array_map('intval', explode(':', $desde));
                $t = $dia->setTime($h, $m);
                [$h, $m] = array_map('intval', explode(':', $hasta));
                $cierre = $dia->setTime($h, $m);
                for (; $this->fin($t) <= $cierre; $t = $t->modify("+$paso minutes")) {
                    if ($t < $minimo) {
                        continue;
                    }
                    $choca = false;
                    foreach ($ocupado as [$oi, $of]) {
                        // Se respeta el descanso antes y después de cada evento.
                        if ($t->getTimestamp() < $of->getTimestamp() + $descanso
                            && $this->fin($t)->getTimestamp() > $oi->getTimestamp() - $descanso) {
                            $choca = true;
                            break;
                        }
                    }
                    if (!$choca) {
                        $libres[] = $t;
                    }
                }
            }
        }
        return $libres;
    }

    private function franja(DateTimeImmutable $t): string
    {
        return (int) $t->format('H') < 13 ? 'manana' : 'tarde';
    }
}
