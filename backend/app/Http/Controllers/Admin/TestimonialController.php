<?php

namespace App\Http\Controllers\Admin;

use App\Http\Resources\TestimonialResource;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TestimonialController extends BaseCrudController
{
    protected function model(): string
    {
        return Testimonial::class;
    }

    protected function resource(): string
    {
        return TestimonialResource::class;
    }

    public function store(Request $request): JsonResponse
    {
        return $this->created(new TestimonialResource(Testimonial::create($this->withProfileId(Testimonial::class, $this->validated($request)))), 'Testimonial created.');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $row = Testimonial::findOrFail($id);
        $row->update($this->validated($request));

        return $this->ok(new TestimonialResource($row), 'Testimonial updated.');
    }

    protected function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'quote' => ['required', 'string', 'min:10'],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'display_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }
}