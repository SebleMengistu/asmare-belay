<?php

namespace App\Http\Controllers\Admin;

use App\Http\Resources\ExperienceResource;
use App\Models\Experience;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExperienceController extends BaseCrudController
{
    protected function model(): string
    {
        return Experience::class;
    }

    protected function resource(): string
    {
        return ExperienceResource::class;
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        return $this->created(new ExperienceResource(Experience::create($data)), 'Experience created.');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $experience = Experience::findOrFail($id);
        $experience->update($this->validated($request));

        return $this->ok(new ExperienceResource($experience), 'Experience updated.');
    }

    protected function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'company' => ['required', 'string', 'max:255'],
            'company_url' => ['nullable', 'url', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'current' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'highlights' => ['nullable', 'array'],
            'display_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }
}