<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage profile') ?? false;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'display_name' => ['nullable', 'string', 'max:255'],
            'headline' => ['nullable', 'string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:500'],
            'bio' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            'email_public' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
            'github' => ['nullable', 'url', 'max:255'],
            'linkedin' => ['nullable', 'url', 'max:255'],
            'twitter' => ['nullable', 'url', 'max:255'],
            'whatsapp' => ['nullable', 'string', 'max:32'],
            'roles' => ['nullable', 'array'],
            'available_for_work' => ['nullable', 'boolean'],
            'meta' => ['nullable', 'array'],
            'avatar' => ['nullable', 'image', 'max:4096', 'mimes:jpeg,png,webp,avif'],
            'cover' => ['nullable', 'image', 'max:8192', 'mimes:jpeg,png,webp,avif'],
            'resume' => ['nullable', 'file', 'max:5120', 'mimes:pdf,doc,docx'],
        ];
    }
}