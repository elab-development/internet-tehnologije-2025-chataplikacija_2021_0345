<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class GroupMemberRemoved implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $groupId,
        public int $userId,
    ) {
        //
    }

    public function broadcastWith(): array
    {
        return [
            'group_id' => $this->groupId,
            'user_id' => $this->userId,
        ];
    }

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('message.group.' . $this->groupId)];
    }
}
