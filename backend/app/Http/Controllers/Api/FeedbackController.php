<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\FeedbackRequest;
use App\Http\Responses\ApiResponse;
use App\Jobs\ForwardFeedback;
use App\Models\Feedback;
use Illuminate\Http\JsonResponse;

class FeedbackController extends Controller
{
    use ApiResponse;

    public function store(FeedbackRequest $request): JsonResponse
    {
        $feedback = Feedback::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'category' => $request->validated('category'),
            'rating' => $request->validated('rating'),
            'message' => $request->validated('message'),
            'ip' => $request->ip(),
            'device' => mb_substr((string) $request->userAgent(), 0, 512),
        ]);

        ForwardFeedback::dispatch($feedback);

        return $this->created(null, 'Thank you for your feedback!');
    }
}
