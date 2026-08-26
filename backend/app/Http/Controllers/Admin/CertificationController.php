<?php

namespace App\Http\Controllers\Admin;

use App\Http\Resources\CertificationResource;
use App\Models\Certification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CertificationController extends BaseCrudController
{
    protected function model(): string
    {
        return Certification::class;
    }

    protected function resource(): string
    {
        return CertificationResource::class;
    }

    public function store(Request $request): JsonResponse
    {
        return $this->created(new CertificationResource(Certification::create($this->validated($request))), 'Certification created.');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $row = Certification::findOrFail($id);
        $row->update($this->validated($request));

        return $this->ok(new CertificationResource($row), 'Certification updated.');
    }

    protected function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'issuer' => ['required', 'string', 'max:255'],
            'credential_url' => ['nullable', 'url', 'max:255'],
            'credential_id' => ['nullable', 'string', 'max:255'],
            'issued_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date', 'after_or_equal:issued_date'],
            'skills' => ['nullable', 'array'],
            'display_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }
}