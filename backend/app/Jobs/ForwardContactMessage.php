<?php

namespace App\Jobs;

use App\Models\ContactMessage;
use App\Models\User;
use App\Notifications\NewContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;

/**
 * Sends a contact-form message to the site owner via email (and Telegram when a
 * bot token is configured). Dispatched asynchronously so slow I/O never blocks
 * the visitor's submission.
 */
class ForwardContactMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public ContactMessage $message)
    {
    }

    public function handle(): void
    {
        // Notify admin(s) by mail.
        User::query()
            ->where('email', '=', config('mail.from.address'))
            ->orWhereHas('roles', fn ($q) => $q->where('name', 'admin'))
            ->get()
            ->each(fn (User $admin) => $admin->notify(new NewContactMessage($this->message)));

        // Telegram (optional).
        $token = config('services.telegram.bot_token');
        $chatId = config('services.telegram.chat_id');

        if ($token && $chatId) {
            $text = "📬 *New portfolio message*\n\n".
                "**{$this->message->name}** ({$this->message->email})\n".
                "Subject: {$this->message->subject}\n\n".
                $this->message->message;

            Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $text,
                'parse_mode' => 'Markdown',
            ]);
        }
    }
}