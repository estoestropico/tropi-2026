<?php
declare(strict_types=1);

// Validación, normalización y anti-spam de los envíos del formulario de contacto.
final class Contacto
{
    public function __construct(private array $config) {}

    // Campo trampa completo o envío más rápido que un humano = bot.
    // Sin JavaScript no llega el tiempo ("t") y solo se evalúa la trampa.
    public function esSpam(array $post): bool
    {
        if (trim((string) ($post['sitio_web'] ?? '')) !== '') {
            return true;
        }
        $segundos = $post['t'] ?? '';
        return $segundos !== '' && (float) $segundos < $this->config['segundos_minimos'];
    }

    /** @return array{0:array,1:array<string,string>} [datos limpios, errores por campo] */
    public function validar(array $post): array
    {
        $errores = [];
        $nombre = $this->texto($post['nombre'] ?? '', 100);
        $email = $this->texto($post['email'] ?? '', 150);
        $telefono = $this->normalizarTelefono((string) ($post['whatsapp'] ?? ''));
        $idea = $this->texto($post['idea'] ?? '', 2000);

        if ($nombre === '') {
            $errores['nombre'] = 'Necesitamos saber tu nombre.';
        }
        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $errores['email'] = 'Revisá el e-mail.';
        }
        if ($telefono === null) {
            $errores['whatsapp'] = 'Revisá el número de WhatsApp (con código de área).';
        }

        $permitidos = array_keys($this->config['tags']['servicios']);
        $servicios = array_values(array_intersect($permitidos, (array) ($post['servicios'] ?? [])));

        [$primero, $resto] = array_pad(preg_split('/\s+/', $nombre, 2), 2, '');

        return [[
            'nombre'    => $primero,
            'apellido'  => $resto,
            'email'     => $email,
            'telefono'  => $telefono,
            'servicios' => $servicios,
            'novedades' => isset($post['novedades']),
            'acepta_whatsapp' => isset($post['acepta_whatsapp']),
            'idea'      => $idea,
        ], $errores];
    }

    // Campos ocultos de origen que completa el sitio; vacíos se omiten.
    public function origen(array $post): array
    {
        $campos = ['landing', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign',
                   'utm_content', 'utm_term', 'gclid', 'fbclid', 'msclkid'];
        $origen = [];
        foreach ($campos as $campo) {
            $valor = $this->texto($post[$campo] ?? '', 300);
            if ($valor !== '') {
                $origen[$campo] = $valor;
            }
        }
        return $origen;
    }

    // Devuelve el teléfono en E.164 (+549…) o null si no es válido.
    // Argentina: acepta 11 2345-6789, 011 15 2345-6789, 54 11…, +54 9 11…
    public function normalizarTelefono(string $entrada): ?string
    {
        $internacional = str_starts_with(trim($entrada), '+') || str_starts_with(trim($entrada), '00');
        $d = preg_replace('/\D/', '', $entrada);
        $pais = $this->config['pais_defecto'];

        if (str_starts_with($d, '00')) {
            $d = substr($d, 2);
        }
        if (!$internacional && !str_starts_with($d, $pais)) {
            $d = ltrim($d, '0');
            // Prefijo móvil local "15" después del código de área (2 a 4 dígitos).
            if (strlen($d) === 12) {
                foreach ([2, 3, 4] as $area) {
                    if (substr($d, $area, 2) === '15') {
                        $d = substr($d, 0, $area) . substr($d, $area + 2);
                        break;
                    }
                }
            }
            $d = $pais . $d;
        }

        if ($pais === '54' && str_starts_with($d, '54')) {
            if (strlen($d) === 12) {
                $d = '549' . substr($d, 2); // WhatsApp usa el 9 de celular
            }
            return (strlen($d) === 13 && $d[2] === '9') ? '+' . $d : null;
        }
        return (strlen($d) >= 8 && strlen($d) <= 15) ? '+' . $d : null;
    }

    // Máximo de envíos por IP por hora; registra el envío si está permitido.
    public function dentroDelLimite(string $ip): bool
    {
        $archivo = $this->config['dir_ratelimit'] . '/' . hash('sha256', $ip) . '.json';
        $ahora = time();
        $envios = is_file($archivo) ? (json_decode((string) file_get_contents($archivo), true) ?: []) : [];
        $envios = array_values(array_filter($envios, fn ($t) => $t > $ahora - 3600));
        if (count($envios) >= $this->config['envios_por_hora']) {
            return false;
        }
        $envios[] = $ahora;
        file_put_contents($archivo, json_encode($envios), LOCK_EX);
        return true;
    }

    public function registrar(array $entrada): void
    {
        $archivo = $this->config['dir_logs'] . '/contactos-' . date('Y-m') . '.log';
        $linea = json_encode(['fecha' => date('c')] + $entrada, JSON_UNESCAPED_UNICODE) . "\n";
        file_put_contents($archivo, $linea, FILE_APPEND | LOCK_EX);
    }

    private function texto(mixed $valor, int $maximo): string
    {
        $limpio = trim(preg_replace('/\s+/u', ' ', strip_tags((string) $valor)));
        return mb_substr($limpio, 0, $maximo);
    }
}
