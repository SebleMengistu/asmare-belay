<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Reusable read/destroy scaffolding for admin CRUD controllers. Concrete
 * controllers implement store()/update() and provide the model + resource.
 */
abstract class BaseCrudController extends Controller
{
    use ApiResponse;

    abstract protected function model(): string;

    abstract protected function resource(): string;

    public function index(Request $request): JsonResponse
    {
        $model = ($this->model())::query();

        if ($request->filled('search')) {
            $model->where('title', 'like', '%'.$request->query('search').'%')
                ->orWhere('name', 'like', '%'.$request->query('search').'%');
        }

        $rows = $model->orderByDesc('created_at')->get();

        return $this->ok($this->resourceCollection($rows));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $row = ($this->model())::with($this->relations())->findOrFail($id);

        return $this->ok(new ($this->resource())($row));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ($this->model())::findOrFail($id)->delete();

        return $this->noContent('Deleted');
    }

    protected function relations(): array
    {
        return [];
    }

    protected function resourceCollection($rows): mixed
    {
        $resource = $this->resource();

        return $resource::collection($rows);
    }
}