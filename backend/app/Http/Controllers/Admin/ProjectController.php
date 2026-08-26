<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\StoreProjectRequest;
use App\Http\Requests\Admin\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends BaseCrudController
{
    protected function model(): string
    {
        return Project::class;
    }

    protected function resource(): string
    {
        return ProjectResource::class;
    }

    protected function relations(): array
    {
        return ['skills'];
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $project = Project::create($request->validated());

        $project->skills()->sync($request->validated('skill_ids', []));

        if ($request->hasFile('media')) {
            foreach ($request->file('media') as $file) {
                $project->addMedia($file)->toMediaCollection('screenshots');
            }
        }

        return $this->created(new ProjectResource($project), 'Project created.');
    }

    public function update(UpdateProjectRequest $request, int $id): JsonResponse
    {
        $project = Project::findOrFail($id);
        $project->update($request->validated());

        if ($request->has('skill_ids')) {
            $project->skills()->sync($request->input('skill_ids', []));
        }

        if ($request->hasFile('media')) {
            foreach ($request->file('media') as $file) {
                $project->addMedia($file)->toMediaCollection('screenshots');
            }
        }

        return $this->ok(new ProjectResource($project), 'Project updated.');
    }
}