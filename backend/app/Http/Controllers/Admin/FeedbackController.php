<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\FeedbackResource;
use App\Http\Responses\ApiResponse;
use App\Models\Feedback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Feedback::query();

        if ($request->boolean('unread')) {
            $query->whereNull('read_at');
        }

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        $rows = $query->orderByDesc('created_at')->paginate(20);

        return $this->ok(
            FeedbackResource::collection($rows),
            'OK',
            ['pagination' => [
                'current_page' => $rows->currentPage(),
                'last_page' => $rows->lastPage(),
                'per_page' => $rows->perPage(),
                'total' => $rows->total(),
            ]]
        );
    }

    public function show(Request $request, int $id): JsonResponse
    {
        return $this->ok(new FeedbackResource(Feedback::findOrFail($id)));
    }

    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $feedback = Feedback::findOrFail($id);
        $feedback->markAsRead();
        return $this->ok(new FeedbackResource($feedback), 'Marked as read.');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        Feedback::findOrFail($id)->delete();
        return $this->noContent('Deleted');
    }

    public function stats(Request $request): JsonResponse
    {
        return $this->ok([
            'total' => Feedback::count(),
            'unread' => Feedback::whereNull('read_at')->count(),
            'avg_rating' => round((float) Feedback::avg('rating'), 1),
            'categories' => Feedback::query()
                ->selectRaw('category, count(*) as total')
                ->whereNotNull('category')
                ->groupBy('category')
                ->orderByDesc('total')
                ->limit(8)
                ->get(),
        ]);
    }
}
