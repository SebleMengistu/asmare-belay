<?php

namespace App\Http\Controllers\Admin;

use App\Http\Resources\PublicationResource;
use App\Models\Publication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicationController extends BaseCrudController
{
    protected function model(): string
    {
        return Publication::class;
    }

    protected function resource(): string
    {
        return PublicationResource::class;
    }

    public function store(Request $request): JsonResponse
    {
        return $this->created(new PublicationResource(Publication::create($this->withProfileId(Publication::class, $this->validated($request)))), 'Publication created.');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $row = Publication::findOrFail($id);
        $row->update($this->validated($request));

        return $this->ok(new PublicationResource($row), 'Publication updated.');
    }

    protected function validated(Request $request): array
    {
        if ($request->has('url')) {
            $request->merge(['url' => $this->normalizeUrl($request->input('url'))]);
        }

        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'authors' => ['nullable', 'string', 'max:500'],
            'venue' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:64'],
            'year' => ['nullable', 'string', 'max:16'],
            'url' => ['nullable', 'url'],
            'doi' => ['nullable', 'string', 'max:255'],
            'abstract' => ['nullable', 'string'],
            'display_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }
}