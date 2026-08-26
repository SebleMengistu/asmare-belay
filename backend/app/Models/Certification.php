<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certification extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'profile_id', 'name', 'issuer', 'credential_url', 'credential_id',
        'issued_date', 'expiry_date', 'skills', 'display_order', 'is_active',
    ];

    protected $casts = [
        'issued_date' => 'date',
        'expiry_date' => 'date',
        'skills' => 'array',
        'display_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }
}