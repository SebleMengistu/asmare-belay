<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;

/**
 * Uniform JSON envelope used by every API controller:
 *   { success, message, data, errors }
 */
trait ApiResponse
{
    protected function respond(mixed $data = null, string $message = 'OK', int $status = 200, array $meta = [], array $errors = null): JsonResponse
    {
        $payload = [
            'success' => $status >= 200 && $status < 300,
            'message' => $message,
            'data' => $data,
            'errors' => $errors,
        ];

        if (! empty($meta)) {
            $payload['meta'] = $meta;
        }

        return response()->json($payload, $status);
    }

    protected function ok(mixed $data = null, string $message = 'OK', array $meta = []): JsonResponse
    {
        return $this->respond($data, $message, 200, $meta);
    }

    protected function created(mixed $data = null, string $message = 'Created', int $status = 201): JsonResponse
    {
        return $this->respond($data, $message, $status);
    }

    protected function noContent(string $message = 'No Content'): JsonResponse
    {
        return $this->respond(null, $message, 204);
    }

    protected function error(string $message, int $status = 400, array $errors = null): JsonResponse
    {
        return $this->respond(null, $message, $status, [], $errors);
    }
}