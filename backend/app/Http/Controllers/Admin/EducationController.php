<?php

namespace App\Http\Controllers\Admin;

use App\Http\Resources\EducationResource;
use App\Models\Education;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EducationController extends BaseCrudController
{
    protected function model(): string
    {
        return Education::class;
    }

    protected function resource(): string
    {
        return EducationResource::class;
    }

    public function store(Request $request): JsonResponse
    {
        return $this->created(new EducationResource(Education::create($this->withProfileId(Education::class, $this->validated($request)))), 'Education created.');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $row = Education::findOrFail($id);
        $row->update($this->validated($request));

        return $this->ok(new EducationResource($row), 'Education updated.');
    }

    protected function validated(Request $request): array
    {
        return $request->validate([
            'degree' => ['required', 'string', 'max:255'],
            'field_of_study' => ['nullable', 'string', 'max:255'],
            'institution' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'grade' => ['nullable', 'string', 'max:64'],
            'description' => ['nullable', 'string'],
            'display_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }
}