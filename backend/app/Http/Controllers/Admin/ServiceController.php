<?php

namespace App\Http\Controllers\Admin;

use App\Http\Resources\ServiceResource;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends BaseCrudController
{
    protected function model(): string
    {
        return Service::class;
    }

    protected function resource(): string
    {
        return ServiceResource::class;
    }

    public function store(Request $request): JsonResponse
    {
        return $this->created(new ServiceResource(Service::create($this->withProfileId(Service::class, $this->validated($request)))), 'Service created.');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $row = Service::findOrFail($id);
        $row->update($this->validated($request));

        return $this->ok(new ServiceResource($row), 'Service updated.');
    }

    protected function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'summary' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:64'],
            'price_from' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'delivery' => ['nullable', 'string', 'max:255'],
            'features' => ['nullable', 'array'],
            'cta_label' => ['nullable', 'string', 'max:255'],
            'display_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }
}