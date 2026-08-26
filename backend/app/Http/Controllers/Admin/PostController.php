<?php

namespace App\Http\Controllers\Admin;

use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Models\PostTag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends BaseCrudController
{
    protected function model(): string
    {
        return Post::class;
    }

    protected function resource(): string
    {
        return PostResource::class;
    }

    protected function relations(): array
    {
        return ['tags'];
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['published_at'] = ($data['status'] ?? 'draft') === 'published'
            ? now()
            : null;

        $post = Post::create($data);
        $this->syncTags($post, $request->input('tags', []));

        return $this->created(new PostResource($post), 'Post created.');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $post = Post::findOrFail($id);
        $data = $this->validated($request);

        if (($data['status'] ?? $post->status) === 'published' && is_null($post->published_at)) {
            $data['published_at'] = now();
        }

        $post->update($data);
        $this->syncTags($post, $request->input('tags', []));

        return $this->ok(new PostResource($post), 'Post updated.');
    }

    protected function syncTags(Post $post, array $tags): void
    {
        $ids = collect($tags)->map(function ($tag) {
            if (is_array($tag)) {
                $tag = $tag['name'] ?? $tag['slug'] ?? null;
            }
            if (! $tag) {
                return null;
            }

            return (PostTag::firstOrCreate(['slug' => \Illuminate\Support\Str::slug($tag)], ['name' => $tag]))->id;
        })->filter();

        $post->tags()->sync($ids);
    }

    protected function validated(Request $request): array
    {
        $id = $this->route('post') ?? $this->route('id');

        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:posts,slug,'.$id],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body' => ['required', 'string'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'status' => ['nullable', 'string', 'in:draft,published'],
            'published_at' => ['nullable', 'date'],
            'tags' => ['nullable', 'array'],
        ]);
    }
}