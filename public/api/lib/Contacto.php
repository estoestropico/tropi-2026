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

    // Verifica el token de reCAPTCHA v3 con Google. Apagado ('activa' => false) o sin
    // clave secreta no verifica (útil en local). Si Google no responde, deja pasar el envío: el resto
    // del anti-spam sigue activo y no se pierde un contacto real por una caída ajena.
    /** @return array{ok:bool, motivo:string, puntaje:?float} */
    public function verificarRecaptcha(string $token, string $ip): array
    {
        $conf = $this->config['recaptcha'] ?? [];
        $secreta = (string) ($conf['secreta'] ?? '');
        if (empty($conf['activa']) || $secreta === '') {
            return ['ok' => true, 'motivo' => 'desactivado', 'puntaje' => null];
        }
        if ($token === '') {
            return ['ok' => false, 'motivo' => 'sin token', 'puntaje' => null];
        }

        $ch = curl_init('https://www.google.com/recaptcha/api/siteverify');
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query(['secret' => $secreta, 'response' => $token, 'remoteip' => $ip]),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 5,
        ]);
        $cuerpo = curl_exec($ch);
        curl_close($ch);
        $r = is_string($cuerpo) ? json_decode($cuerpo, true) : null;
        if (!is_array($r)) {
            return ['ok' => true, 'motivo' => 'google sin respuesta', 'puntaje' => null];
        }

        $puntaje = isset($r['score']) ? (float) $r['score'] : null;
        if (empty($r['success'])) {
            return ['ok' => false, 'motivo' => 'token inválido: ' . implode(', ', $r['error-codes'] ?? []), 'puntaje' => $puntaje];
        }
        if (($r['action'] ?? '') !== 'contacto') {
            return ['ok' => false, 'motivo' => 'acción inesperada: ' . ($r['action'] ?? ''), 'puntaje' => $puntaje];
        }
        if ($puntaje !== null && $puntaje < (float) ($conf['puntaje_minimo'] ?? 0.5)) {
            return ['ok' => false, 'motivo' => 'puntaje bajo', 'puntaje' => $puntaje];
        }
        return ['ok' => true, 'motivo' => 'ok', 'puntaje' => $puntaje];
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

    // Prepara la consulta para citarla en la plantilla de WhatsApp. Devuelve null si
    // no conviene citarla: muy corta, o con links, emails o teléfonos (el formulario
    // no puede servir para hacer circular esos datos en nombre de Trópico). Si es
    // larga, la recorta sin cortar palabras. Ya llega en una sola línea, como pide Meta.
    public function consultaParaPlantilla(string $idea, int $maximo, int $minimo): ?string
    {
        $idea = trim($idea);
        if (mb_strlen($idea) < $minimo) {
            return null;
        }
        $patrones = [
            '~https?://|www\.~i',                                 // links
            '~\b[a-z0-9-]+\.(com|net|org|ar|io|co|info|biz|app|store|shop|online|site|xyz|me)\b~i', // dominios
            '~\S+@\S+~',                                          // emails
            '~(?:\d[\s.\-]?){7,}~',                               // teléfonos
        ];
        foreach ($patrones as $patron) {
            if (preg_match($patron, $idea)) {
                return null;
            }
        }
        if (mb_strlen($idea) > $maximo) {
            $corte = mb_substr($idea, 0, $maximo - 1);
            $espacio = mb_strrpos($corte, ' ');
            $idea = rtrim(mb_substr($corte, 0, $espacio ?: null), " ,.;:") . '…';
        }
        return $idea;
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
            $d = $pais . ltrim($d, '0');
        }

        // Argentina. El selector de país del formulario antepone "+54 9", y detrás
        // la gente escribe el número como lo conoce: con 0, con 15 o con el 9 otra
        // vez. Se reduce todo a los 10 dígitos de área + número y se arma +549….
        if ($pais === '54' && str_starts_with($d, '54')) {
            $n = substr($d, 2);
            if (strlen($n) > 10 && $n[0] === '9') {
                $n = substr($n, 1); // 9 de celular
            }
            $n = ltrim($n, '0');
            if (strlen($n) > 10 && $n[0] === '9') {
                $n = substr($n, 1); // 9 repetido después del 0
            }
            // Prefijo móvil local "15" después del código de área (2 a 4 dígitos).
            if (strlen($n) === 12) {
                foreach ([2, 3, 4] as $area) {
                    if (substr($n, $area, 2) === '15') {
                        $n = substr($n, 0, $area) . substr($n, $area + 2);
                        break;
                    }
                }
            }
            return strlen($n) === 10 ? '+549' . $n : null;
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
