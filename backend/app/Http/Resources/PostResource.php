<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'body' => $this->body,
            'status' => $this->status,
            'published_at' => $this->published_at?->toIso8601String(),
            'tags' => $this->whenLoaded('tags'),
            'cover' => $this->getMedia('cover')->first()?->getUrl('card'),
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
        ];
    }
}