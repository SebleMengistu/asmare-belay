<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ContactRequest;
use App\Http\Responses\ApiResponse;
use App\Jobs\ForwardContactMessage;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;

class ContactController extends Controller
{
    use ApiResponse;

    public function store(ContactRequest $request): JsonResponse
    {
        $message = ContactMessage::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'phone' => $request->validated('phone'),
            'subject' => $request->validated('subject', 'General inquiry'),
            'message' => $request->validated('message'),
            'ip' => $request->ip(),
            'device' => mb_substr((string) $request->userAgent(), 0, 512),
        ]);

        ForwardContactMessage::dispatch($message);

        return $this->created(null, 'Message received. Thank you for reaching out!');
    }
}