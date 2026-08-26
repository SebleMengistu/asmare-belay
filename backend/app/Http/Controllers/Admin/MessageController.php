<?php

namespace App\Http\Controllers\Admin;

use App\Http\Resources\ContactMessageResource;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends BaseCrudController
{
    protected function model(): string
    {
        return ContactMessage::class;
    }

    protected function resource(): string
    {
        return ContactMessageResource::class;
    }

    public function index(Request $request): JsonResponse
    {
        $query = ContactMessage::query();

        if ($request->boolean('unread')) {
            $query->whereNull('read_at');
        }

        $messages = $query->orderByDesc('created_at')->paginate(20);

        return $this->ok(
            ContactMessageResource::collection($messages),
            'OK',
            ['pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ]]
        );
    }

    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $message = ContactMessage::findOrFail($id);
        $message->markAsRead();

        return $this->ok(new ContactMessageResource($message), 'Marked as read.');
    }

    public function stats(Request $request): JsonResponse
    {
        return $this->ok([
            'total' => ContactMessage::count(),
            'unread' => ContactMessage::whereNull('read_at')->count(),
        ]);
    }
}