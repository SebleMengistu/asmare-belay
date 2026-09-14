<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'email', 'category', 'rating', 'message', 'ip', 'device',
        'read_at',
    ];

    protected $casts = [
        'rating' => 'integer',
        'read_at' => 'datetime',
    ];

    public function markAsRead(): void
    {
        if (is_null($this->read_at)) {
            $this->forceFill(['read_at' => now()])->save();
        }
    }
}
