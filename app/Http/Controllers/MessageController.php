<?php

namespace App\Http\Controllers;

use App\Events\MessageDeleted;
use App\Events\SocketMessage;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Group;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;

class MessageController extends Controller
{
    //LOAD MESAGES BY USER
    public function byUser(User $user)
    {
        $messages = Message::where('sender_id', auth()->id())
            ->where('receiver_id', $user->id)
            ->orWhere('sender_id', $user->id)
            ->where('receiver_id', auth()->id())
            ->latest()
            ->paginate(10);

        return inertia('Home', [
            'selectedConversation' => $user->toConversationArray(),
            'messages' => MessageResource::collection($messages),
        ]);
    }
    
    //LOAD MESAGES BY GROUP
    public function byGroup(Group $group)
    {
        $messages = Message::where('group_id', $group->id)
            ->latest()
            ->paginate(10);

        return inertia('Home', [
            'selectedConversation' => $group->toConversationArray(),
            'messages' => MessageResource::collection($messages),
        ]);
    }


    #[OA\Get(
        path: '/message/older/{message}',
        summary: 'Učitaj starije poruke od date poruke (beskonačan skrol)',
        tags: ['Messages'],
        parameters: [
            new OA\Parameter(name: 'message', in: 'path', required: true, description: 'ID najstarije trenutno učitane poruke', schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Lista starijih poruka (paginirano, 10 po stranici)'),
        ]
    )]
    //LOAD OLDER MESSAGES
    public function loadOlder(Message $message)
    {
        // sort them by the latest
        if ($message->group_id) {
            $messages = Message::where('created_at', '<', $message->created_at)
                ->where('group_id', $message->group_id)
                ->latest()
                ->paginate(10);
        } else {
            $messages = Message::where('created_at', '<', $message->created_at)
                ->where(function ($query) use ($message) {
                    $query->where('sender_id', $message->sender_id)
                        ->where('receiver_id', $message->receiver_id)
                        ->orWhere('sender_id', $message->receiver_id)
                        ->where('receiver_id', $message->sender_id);
                })
                ->latest()
                ->paginate(10);
        }

        return MessageResource::collection($messages);
    }


    #[OA\Post(
        path: '/message',
        summary: 'Pošalji poruku (tekst i/ili prilozi) korisniku ili grupi',
        tags: ['Messages'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', nullable: true, example: 'Ćao!'),
                        new OA\Property(property: 'receiver_id', type: 'integer', nullable: true, description: 'Obavezno ako group_id nije poslat'),
                        new OA\Property(property: 'group_id', type: 'integer', nullable: true, description: 'Obavezno ako receiver_id nije poslat'),
                        new OA\Property(
                            property: 'attachments',
                            type: 'array',
                            items: new OA\Items(type: 'string', format: 'binary'),
                            description: 'Do 10 fajlova, max 100MB po fajlu'
                        ),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Poruka sačuvana'),
            new OA\Response(response: 422, description: 'Validacija nije prošla'),
        ]
    )]
    //SKLADISTI NOVI
    public function store(StoreMessageRequest $request)
    {
        $data = $request->validated();
        $data['sender_id'] = auth()->id();

        $receiverId = $data['receiver_id'] ?? null;
        $groupId = $data['group_id'] ?? null;

        $files = $data['attachments'] ?? [];

        $message = Message::create($data);

        $attachments = [];

        if ($files) {
            foreach ($files as $file) {
                $directory = 'attachments/' . Str::random(32);
                Storage::makeDirectory($directory);

                $model = [
                    'message_id' => $message->id,
                    'name' => $file->getClientOriginalName(),
                    'mime' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                    'path' => $file->store($directory, 'public'),
                ];

                $attachment = MessageAttachment::create($model);
                $attachments[] = $attachment;
            }
            $message->attachments = $attachments;
        }
        if ($receiverId) {
            Conversation::updateConversationWithMessage(
                $receiverId,
                auth()->id(),
                $message
            );
        }

        if ($groupId) {
            Group::updateGroupWithMessage($groupId, $message);
        }

        SocketMessage::dispatch($message);

        return new MessageResource($message);
    }


    #[OA\Delete(
        path: '/message/{message}',
        summary: 'Obriši poruku (samo vlasnik poruke sme)',
        tags: ['Messages'],
        parameters: [
            new OA\Parameter(name: 'message', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 204, description: 'Poruka obrisana'),
            new OA\Response(response: 403, description: 'Nisi vlasnik ove poruke'),
        ]
    )]
    //DELETE MESSAGE
    public function destroy(Message $message)
    {
        //check if the user is owner of message
        if ($message->sender_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $id = $message->id;
        $senderId = $message->sender_id;
        $receiverId = $message->receiver_id;
        $groupId = $message->group_id;

        foreach ($message->attachments as $attachment) {
            Storage::disk('public')->deleteDirectory(dirname($attachment->path));
            $attachment->delete();
        }

        // Repoint last_message_id if this message was the most recent one,
        // otherwise deleting it would violate the foreign key constraint.
        if ($groupId) {
            $group = Group::where('last_message_id', $id)->first();

            if ($group) {
                $previous = Message::where('group_id', $groupId)
                    ->where('id', '!=', $id)
                    ->latest()
                    ->first();

                $group->update(['last_message_id' => $previous?->id]);
            }
        } else {
            $conversation = Conversation::where('last_message_id', $id)->first();

            if ($conversation) {
                $previous = Message::where(function ($query) use ($senderId, $receiverId) {
                    $query->where('sender_id', $senderId)
                        ->where('receiver_id', $receiverId);
                })->orWhere(function ($query) use ($senderId, $receiverId) {
                    $query->where('sender_id', $receiverId)
                        ->where('receiver_id', $senderId);
                })
                    ->where('id', '!=', $id)
                    ->latest()
                    ->first();

                $conversation->update(['last_message_id' => $previous?->id]);
            }
        }

        $message->delete();

        MessageDeleted::dispatch($id, $senderId, $receiverId, $groupId);

        return response('', 204);
    }

        

}
