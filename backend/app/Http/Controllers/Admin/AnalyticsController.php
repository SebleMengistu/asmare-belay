<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\AnalyticsEvent;
use App\Models\ContactMessage;
use App\Models\Feedback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    use ApiResponse;

    public function overview(Request $request): JsonResponse
    {
        $range = $this->range($request);
        $query = AnalyticsEvent::query();

        if ($range) {
            $query->whereBetween('occurred_at', [$range['from'], $range['to']]);
        }

        $pageviews = (clone $query)->where('event', 'pageview')->count();
        $uniqueVisitors = (clone $query)->where('event', 'pageview')->distinct('ip')->count('ip');
        $keyEvents = (clone $query)->where('event', '!=', 'pageview');

        $outbound = [
            'github_click' => (clone $keyEvents)->where('event', 'github_click')->count(),
            'linkedin_click' => (clone $keyEvents)->where('event', 'linkedin_click')->count(),
            'email_click' => (clone $keyEvents)->where('event', 'email_click')->count(),
            'telegram_click' => (clone $keyEvents)->where('event', 'telegram_click')->count(),
            'demo_click' => (clone $keyEvents)->where('event', 'demo_click')->count(),
            'cv_download' => (clone $keyEvents)->where('event', 'cv_download')->count(),
            'contact_form_submit' => (clone $keyEvents)->where('event', 'contact_form_submit')->count(),
            'feedback_submit' => (clone $keyEvents)->where('event', 'feedback_submit')->count(),
        ];

        $topPages = (clone $query)
            ->where('event', 'pageview')
            ->whereNotNull('path')
            ->selectRaw('path, count(*) as total')
            ->groupBy('path')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $trend = $this->trend($request, $query);

        return $this->ok([
            'range' => $range ? [
                'from' => $range['from']->toDateString(),
                'to' => $range['to']->toDateString(),
            ] : null,
            'totals' => [
                'pageviews' => $pageviews,
                'unique_visitors' => $uniqueVisitors,
                'contacts' => $this->countRange(ContactMessage::query(), $range),
                'feedback' => $this->countRange(Feedback::query(), $range),
            ],
            'outbound' => $outbound,
            'top_pages' => $topPages,
            'trend' => $trend,
        ]);
    }

    private function range(Request $request): ?array
    {
        $from = $request->query('from');
        $to = $request->query('to');
        if ($from && $to) {
            return [
                'from' => \Carbon\Carbon::parse($from)->startOfDay(),
                'to' => \Carbon\Carbon::parse($to)->endOfDay(),
            ];
        }
        return null;
    }

    private function countRange($query, ?array $range)
    {
        if ($range && $query->getModel()->getCreatedAtColumn()) {
            $query->whereBetween('created_at', [$range['from'], $range['to']]);
        }
        return $query->count();
    }

    private function trend(Request $request, $query): array
    {
        $from = $request->query('from');
        $to = $request->query('to');

        if (!$from || !$to) {
            $to = now()->endOfDay();
            $from = now()->subDays(13)->startOfDay();
        } else {
            $from = \Carbon\Carbon::parse($from)->startOfDay();
            $to = \Carbon\Carbon::parse($to)->endOfDay();
        }

        return \App\Models\AnalyticsEvent::query()
            ->whereBetween('occurred_at', [$from, $to])
            ->selectRaw("date(occurred_at) as day, sum(case when event = 'pageview' then 1 else 0 end) as pageviews, count(*) as total")
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn ($row) => [
                'date' => (string) $row->day,
                'pageviews' => (int) $row->pageviews,
                'events' => (int) $row->total,
            ])
            ->toArray();
    }
}
