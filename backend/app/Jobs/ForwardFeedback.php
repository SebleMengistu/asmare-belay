<?php

namespace App\Jobs;

use App\Models\Feedback;
use App\Models\User;
use App\Notifications\NewFeedback;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;

class ForwardFeedback implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public Feedback $feedback)
    {
    }

    public function handle(): void
    {
        User::query()
            ->where('email', '=', config('mail.from.address'))
            ->orWhereHas('roles', fn ($q) => $q->where('name', 'admin'))
            ->get()
            ->each(fn (User $admin) => $admin->notify(new NewFeedback($this->feedback)));

        $token = config('services.telegram.bot_token');
        $chatId = config('services.telegram.chat_id');

        if ($token && $chatId) {
            $category = $this->feedback->category ? ' ('.$this->feedback->category.')' : '';
            $stars = $this->feedback->rating ? str_repeat('⭐', $this->feedback->rating) : '';

            $text = "💬 *New portfolio feedback{$category}*\n\n".
                ($this->feedback->name ? "**{$this->feedback->name}**\n" : '').
                ($this->feedback->email ? "Email: {$this->feedback->email}\n" : '').
                ($stars ? "Rating: {$stars}\n" : '').
                "\n".$this->feedback->message;

            Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $text,
                'parse_mode' => 'Markdown',
            ]);
        }
    }
}
