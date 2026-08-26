<?php

namespace App\Http\Controllers\Admin;

use App\Http\Resources\SkillResource;
use App\Models\Skill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SkillController extends BaseCrudController
{
    protected function model(): string
    {
        return Skill::class;
    }

    protected function resource(): string
    {
        return SkillResource::class;
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:64'],
            'level' => ['nullable', 'integer', 'min:0', 'max:100'],
            'icon' => ['nullable', 'string', 'max:64'],
            'color' => ['nullable', 'string', 'max:32'],
            'display_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        return $this->created(new SkillResource(Skill::create($data)), 'Skill created.');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $skill = Skill::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:64'],
            'level' => ['nullable', 'integer', 'min:0', 'max:100'],
            'icon' => ['nullable', 'string', 'max:64'],
            'color' => ['nullable', 'string', 'max:32'],
            'display_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $skill->update($data);

        return $this->ok(new SkillResource($skill), 'Skill updated.');
    }
}