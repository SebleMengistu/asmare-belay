<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'authors' => $this->authors,
            'venue' => $this->venue,
            'type' => $this->type,
            'year' => $this->year,
            'url' => $this->url,
            'doi' => $this->doi,
            'abstract' => $this->abstract,
        ];
    }
}