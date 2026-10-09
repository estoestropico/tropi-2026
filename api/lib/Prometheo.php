<?php
declare(strict_types=1);

// Cliente mínimo de la API pública de Prometheo (https://prometheo.gitbook.io/prometheo-api).
final class Prometheo
{
    public function __construct(
        private string $apiKey,
        private string $base,
        private int $timeout = 8,
    ) {}

    /** @return array{0:int,1:array} [código HTTP, cuerpo decodificado] */
    public function crearLead(array $lead): array
    {
        return $this->llamar('POST', '/leads', $lead);
    }

    public function actualizarLead(string $id, array $cambios): array
    {
        return $this->llamar('PATCH', '/leads/' . rawurlencode($id), $cambios);
    }

    // Envía una plantilla aprobada de Meta. No requiere la ventana de 24 h.
    // El teléfono va en dígitos, sin "+"; los parámetros usan el nombre de cada variable (p. ej. v_1).
    public function enviarPlantilla(string $telefono, string $nombre, string $idioma, array $parametros = []): array
    {
        $cuerpo = [
            'phone_number'      => preg_replace('/\D/', '', $telefono),
            'template_name'     => $nombre,
            'template_language' => $idioma,
        ];
        if ($parametros) {
            $cuerpo['parameters'] = array_map('strval', $parametros);
        }
        return $this->llamar('POST', '/whatsapp-business/message/template', $cuerpo);
    }

    // Busca un lead por teléfono comparando solo dígitos (la API normaliza a E.164).
    public function buscarPorTelefono(string $telefono): ?array
    {
        $digitos = preg_replace('/\D/', '', $telefono);
        [$codigo, $datos] = $this->llamar('GET', '/leads?' . http_build_query(['search' => $digitos, 'limit' => 20]));
        if ($codigo !== 200) {
            throw new RuntimeException("Búsqueda de lead respondió $codigo: " . ($datos['message'] ?? ''));
        }
        foreach ($datos['leads'] ?? [] as $lead) {
            foreach ([$lead['phone_number'] ?? '', $lead['contact_id'] ?? ''] as $valor) {
                if ($valor !== '' && preg_replace('/\D/', '', (string) $valor) === $digitos) {
                    return $lead;
                }
            }
        }
        return null;
    }

    private function llamar(string $metodo, string $ruta, ?array $cuerpo = null): array
    {
        $ch = curl_init(rtrim($this->base, '/') . $ruta);
        $cabeceras = ['Authorization: Bearer ' . $this->apiKey, 'Accept: application/json'];
        if ($cuerpo !== null) {
            $cabeceras[] = 'Content-Type: application/json';
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($cuerpo, JSON_UNESCAPED_UNICODE));
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
            throw new RuntimeException("Sin respuesta de Prometheo ($metodo $ruta): $error");
        }
        return [$codigo, json_decode($respuesta, true) ?? ['message' => $respuesta]];
    }
}
