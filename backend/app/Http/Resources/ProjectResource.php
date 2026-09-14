<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'description' => $this->description,
            'category' => $this->category,
            'repo_url' => $this->repo_url,
            'demo_url' => $this->demo_url,
            'tech_stack' => $this->tech_stack,
            'featured' => $this->featured,
            'display_order' => $this->display_order,
            'is_active' => (bool) $this->is_active,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'skills' => SkillResource::collection($this->whenLoaded('skills')),
            'screenshots' => $this->getMedia('screenshots')->map(fn ($m) => [
                'id' => $m->id,
                'url' => $m->getUrl(),
                'thumb' => $m->getUrl('thumb'),
                'card' => $m->getUrl('card'),
                'hero' => $m->getUrl('hero'),
            ]),
        ];
    }
}