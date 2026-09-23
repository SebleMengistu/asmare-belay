<?php

namespace App\Notifications;

use App\Models\Feedback;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class NewFeedback extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Feedback $feedback)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): \Illuminate\Notifications\Messages\MailMessage
    {
        $category = $this->feedback->category ? ' ('.$this->feedback->category.')' : '';

        return (new \Illuminate\Notifications\Messages\MailMessage)
            ->subject('New portfolio feedback'.$category)
            ->greeting('New feedback received')
            ->line($this->feedback->message)
            ->line('From: '.($this->feedback->name ?: $this->feedback->email ?: 'Anonymous'))
            ->salutation('ASMARE Portfolio');
    }
}
