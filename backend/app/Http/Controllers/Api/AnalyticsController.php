<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AnalyticsEventRequest;
use App\Http\Responses\ApiResponse;
use App\Models\AnalyticsEvent;
use Illuminate\Http\JsonResponse;

/**
 * Anonymous, privacy-focused intake for lightweight page-view analytics.
 * Only stores a hashed IP (never the raw address) to stay GDPR-friendly.
 */
class AnalyticsController extends Controller
{
    use ApiResponse;

    public function store(AnalyticsEventRequest $request): JsonResponse
    {
        if (! config('analytics.enabled')) {
            return $this->noContent();
        }

        AnalyticsEvent::create([
            'event' => $request->validated('event', 'pageview'),
            'path' => $request->validated('path'),
            'referrer' => $request->validated('referrer'),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 512),
            'ip' => hash('sha256', (string) $request->ip()),
            'meta' => $request->validated('meta'),
            'occurred_at' => now(),
        ]);

        return $this->noContent();
    }
}