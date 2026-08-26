<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\ContactMessage;
use App\Models\Post;
use App\Models\Profile;
use App\Models\Project;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $profile = Profile::first();

        return $this->ok([
            'counts' => [
                'projects' => Project::count(),
                'posts' => Post::count(),
                'published_posts' => Post::where('status', 'published')->count(),
                'messages' => ContactMessage::count(),
                'unread_messages' => ContactMessage::whereNull('read_at')->count(),
            ],
            'profile' => $profile ? [
                'id' => $profile->id,
                'display_name' => $profile->display_name,
                'headline' => $profile->headline,
                'available_for_work' => $profile->available_for_work,
            ] : null,
            'recent_messages' => ContactMessage::latest()->limit(5)->get(['id', 'name', 'email', 'subject', 'read_at', 'created_at']),
        ]);
    }
}