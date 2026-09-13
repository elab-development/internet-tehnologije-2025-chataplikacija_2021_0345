<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class MessageDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $messageId,
        public ?int $senderId,
        public ?int $receiverId,
        public ?int $groupId,
    ) {
        //
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->messageId,
        ];
    }

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        if ($this->groupId) {
            return [new PrivateChannel('message.group.' . $this->groupId)];
        }

        return [new PrivateChannel(
            'message.user.' .
            collect([$this->senderId, $this->receiverId])
                ->sort()
                ->implode('-')
        )];
    }
}
