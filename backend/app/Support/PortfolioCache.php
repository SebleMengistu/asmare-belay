<?php

namespace App\Support;

use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * Centralises cache keys + TTL for the public read endpoints.
 *
 * Supabase's managed pooler is ~1.5s per connect + ~0.7s per query from this
 * network, so un-cached reads are painfully slow and can stall navigations
 * through the dev proxy. Content writes (see AppServiceProvider's model-event
 * hooks) call flush(), so edits are never delayed by staleness.
 */
class PortfolioCache
{
    /** How long a computed public payload may be reused before recompute. */
    public const TTL = 1800; // 30 minutes — safe because model-event hooks flush on writes

    /** Invalidate every cached public payload (called on content writes). */
    public static function flush(): void
    {
        Cache::flush();
    }

    public static function key(string $piece, string $suffix = ''): string
    {
        return 'portfolio.'.$piece.($suffix !== '' ? '.'.$suffix : '');
    }

    public static function remember(string $piece, Closure $callback, ?string $suffix = null, int $ttl = self::TTL): mixed
    {
        return Cache::remember(self::key($piece, (string) $suffix), $ttl, $callback);
    }
}