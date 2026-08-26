<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\UpdateProfileRequest;
use App\Http\Resources\ProfileResource;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends BaseCrudController
{
    protected function model(): string
    {
        return Profile::class;
    }

    protected function resource(): string
    {
        return ProfileResource::class;
    }

    protected function relations(): array
    {
        return ['skills', 'experiences', 'educations', 'certifications', 'projects', 'services', 'publications', 'testimonials'];
    }

    public function index(Request $request): JsonResponse
    {
        return $this->ok(ProfileResource::collection(Profile::all()));
    }

    public function update(UpdateProfileRequest $request, int $id): JsonResponse
    {
        $profile = Profile::findOrFail($id);
        $profile->update($request->validated());

        if ($request->hasFile('avatar')) {
            $profile->clearMediaCollection('avatar');
            $profile->addMedia($request->file('avatar'))->toMediaCollection('avatar');
        }

        if ($request->hasFile('cover')) {
            $profile->clearMediaCollection('cover');
            $profile->addMedia($request->file('cover'))->toMediaCollection('cover');
        }

        if ($request->hasFile('resume')) {
            $profile->clearMediaCollection('resume');
            $profile->addMedia($request->file('resume'))->toMediaCollection('resume');
        }

        return $this->ok(new ProfileResource($profile), 'Profile updated.');
    }
}