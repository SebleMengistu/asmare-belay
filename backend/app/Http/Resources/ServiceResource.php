<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'description' => $this->description,
            'icon' => $this->icon,
            'price_from' => $this->price_from,
            'currency' => $this->currency,
            'delivery' => $this->delivery,
            'features' => $this->features,
            'cta_label' => $this->cta_label,
            'display_order' => $this->display_order,
        ];
    }
}