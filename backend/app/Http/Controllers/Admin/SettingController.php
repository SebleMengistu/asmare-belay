<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        return $this->ok(Setting::all()->map(fn ($s) => [
            'key' => $s->key,
            'value' => $s->value,
            'group' => $s->group,
            'is_public' => $s->is_public,
        ])->groupBy('group'));
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string', 'max:255'],
            'settings.*.value' => ['nullable'],
            'settings.*.group' => ['nullable', 'string', 'max:64'],
            'settings.*.is_public' => ['nullable', 'boolean'],
        ]);

        foreach ($data['settings'] as $item) {
            Setting::set(
                $item['key'],
                $item['value'] ?? '',
                $item['group'] ?? 'general',
                $item['is_public'] ?? false
            );
        }

        return $this->ok(null, 'Settings saved.');
    }
}