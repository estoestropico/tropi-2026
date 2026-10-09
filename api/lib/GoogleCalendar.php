<?php
declare(strict_types=1);

// Cliente mínimo de Google Calendar API v3 con OAuth 2.0 (refresh token de la cuenta dueña de la agenda).
final class GoogleCalendar
{
    private ?string $accessToken = null;

    public function __construct(
        private string $clientId,
        private string $clientSecret,
        private string $refreshToken,
        private string $calendario = 'primary',
        private int $timeout = 10,
        private string $base = 'https://www.googleapis.com/calendar/v3',
        private string $tokenUrl = 'https://oauth2.googleapis.com/token',
    ) {}

    /** @return list<array{0:DateTimeImmutable,1:DateTimeImmutable}> intervalos ocupados entre $desde y $hasta */
    public function ocupado(DateTimeImmutable $desde, DateTimeImmutable $hasta): array
    {
        $datos = $this->llamar('POST', '/freeBusy', [
            'timeMin' => $desde->format(DATE_RFC3339),
            'timeMax' => $hasta->format(DATE_RFC3339),
            'items'   => [['id' => $this->calendario]],
        ]);
        $cal = $datos['calendars'][$this->calendario] ?? null;
        if ($cal === null || !empty($cal['errors'])) {
            throw new RuntimeException('freeBusy sin datos del calendario: ' . json_encode($cal['errors'] ?? null));
        }
        return array_map(
            fn ($b) => [new DateTimeImmutable($b['start']), new DateTimeImmutable($b['end'])],
            $cal['busy'] ?? []
        );
    }

    // Eventos que empiezan en $inicio y mencionan $texto (se usa para no duplicar una reserva reintentada).
    public function buscarEventos(DateTimeImmutable $inicio, DateTimeImmutable $fin, string $texto): array
    {
        $datos = $this->llamar('GET', $this->rutaEventos() . '?' . http_build_query([
            'timeMin'      => $inicio->format(DATE_RFC3339),
            'timeMax'      => $fin->format(DATE_RFC3339),
            'q'            => $texto,
            'singleEvents' => 'true',
        ]));
        return $datos['items'] ?? [];
    }

    // Crea el evento con link de Google Meet y envía la invitación por mail a los invitados.
    public function crearEvento(array $evento): array
    {
        $evento['conferenceData'] = ['createRequest' => [
            'requestId'             => bin2hex(random_bytes(8)),
            'conferenceSolutionKey' => ['type' => 'hangoutsMeet'],
        ]];
        return $this->llamar('POST', $this->rutaEventos() . '?conferenceDataVersion=1&sendUpdates=all', $evento);
    }

    private function rutaEventos(): string
    {
        return '/calendars/' . rawurlencode($this->calendario) . '/events';
    }

    private function token(): string
    {
        if ($this->accessToken !== null) {
            return $this->accessToken;
        }
        [$codigo, $datos] = $this->http('POST', $this->tokenUrl, http_build_query([
            'client_id'     => $this->clientId,
            'client_secret' => $this->clientSecret,
            'refresh_token' => $this->refreshToken,
            'grant_type'    => 'refresh_token',
        ]), ['Content-Type: application/x-www-form-urlencoded']);
        if ($codigo !== 200 || empty($datos['access_token'])) {
            throw new RuntimeException("Google OAuth respondió $codigo: " . ($datos['error_description'] ?? $datos['error'] ?? ''));
        }
        return $this->accessToken = $datos['access_token'];
    }

    private function llamar(string $metodo, string $ruta, ?array $cuerpo = null): array
    {
        $cabeceras = ['Authorization: Bearer ' . $this->token(), 'Accept: application/json'];
        if ($cuerpo !== null) {
            $cabeceras[] = 'Content-Type: application/json';
        }
        [$codigo, $datos] = $this->http($metodo, rtrim($this->base, '/') . $ruta,
            $cuerpo === null ? null : json_encode($cuerpo, JSON_UNESCAPED_UNICODE), $cabeceras);
        if ($codigo < 200 || $codigo >= 300) {
            throw new RuntimeException("Google Calendar ($metodo $ruta) respondió $codigo: " . ($datos['error']['message'] ?? ''));
        }
        return $datos;
    }

    private function http(string $metodo, string $url, ?string $cuerpo, array $cabeceras): array
    {
        $ch = curl_init($url);
        if ($cuerpo !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $cuerpo);
        }
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST  => $metodo,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $this->timeout,
            CURLOPT_HTTPHEADER     => $cabeceras,
        ]);
        $respuesta = curl_exec($ch);
        $codigo = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($respuesta === false) {
            throw new RuntimeException("Sin respuesta de Google ($metodo $url): $error");
        }
        return [$codigo, json_decode($respuesta, true) ?? []];
    }
}
