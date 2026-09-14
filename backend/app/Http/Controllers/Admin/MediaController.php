<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\MediaLibrary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MediaController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Media::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->query('search').'%')
                ->orWhere('file_name', 'like', '%'.$request->query('search').'%');
        }

        $rows = $query->orderByDesc('id')->paginate(24);

        $items = collect($rows->items())->map(fn (Media $m) => [
            'id' => $m->id,
            'name' => $m->name,
            'file_name' => $m->file_name,
            'mime_type' => $m->mime_type,
            'size' => $m->size,
            'collection_name' => $m->collection_name,
            'model_type' => class_basename($m->model_type),
            'url' => $m->getUrl(),
            'thumb' => method_exists($m, 'getUrl') ? ($m->hasGeneratedConversion('thumb') ? $m->getUrl('thumb') : $m->getUrl()) : $m->getUrl(),
            'created_at' => $m->created_at?->toIso8601String(),
        ]);

        return $this->ok(
            $items,
            'OK',
            ['pagination' => [
                'current_page' => $rows->currentPage(),
                'last_page' => $rows->lastPage(),
                'per_page' => $rows->perPage(),
                'total' => $rows->total(),
            ]]
        );
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'media' => ['required', 'file'],
        ]);

        if (! $request->file('media')->isValid()) {
            return $this->error('Upload failed.', 422);
        }

        $holder = MediaLibrary::firstOrCreate(['id' => 1]);

        $media = $holder->addMediaFromRequest('media')->toMediaCollection('library');

        return $this->created([
            'id' => $media->id,
            'name' => $media->name,
            'file_name' => $media->file_name,
            'mime_type' => $media->mime_type,
            'size' => $media->size,
            'url' => $media->getUrl(),
        ], 'Media uploaded.');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $media = Media::findOrFail($id);
        $media->delete();
        return $this->noContent('Deleted');
    }
}
