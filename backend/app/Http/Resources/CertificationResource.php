<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CertificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'issuer' => $this->issuer,
            'credential_url' => $this->credential_url,
            'credential_id' => $this->credential_id,
            'issued_date' => $this->issued_date?->toDateString(),
            'expiry_date' => $this->expiry_date?->toDateString(),
            'skills' => $this->skills,
            'image' => $this->image,
            'display_order' => $this->display_order,
            'is_active' => (bool) $this->is_active,
        ];
    }
}