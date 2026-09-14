<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'display_name' => $this->display_name,
            'headline' => $this->headline,
            'tagline' => $this->tagline,
            'bio' => $this->bio,
            'location' => $this->location,
            'website' => $this->website,
            // Public contact channels are intentional portfolio data (shown on
            // the about/contact card); owners control them via the admin panel.
            'email_public' => $this->email_public,
            'phone' => $this->phone,
            'github' => $this->github,
            'linkedin' => $this->linkedin,
            'twitter' => $this->twitter,
            'whatsapp' => $this->whatsapp,
            'roles' => $this->roles,
            'available_for_work' => $this->available_for_work,
            'meta' => $this->meta,
            'avatar' => $this->getMedia('avatar')->first()?->getUrl('thumb'),
            'cover' => $this->getMedia('cover')->first()?->getUrl('hero'),
            'resume' => $this->getMedia('resume')->first()?->getUrl(),
        ];
    }
}