<?php

namespace App\Http\Controllers;

use App\Events\GroupDeleted;
use App\Events\GroupMemberRemoved;
use App\Http\Requests\StoreGroupRequest;
use App\Http\Requests\UpdateGroupRequest;
use App\Models\Group;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use OpenApi\Attributes as OA;

class GroupController extends Controller
{
    #[OA\Post(
        path: '/group',
        summary: 'Napravi novu grupu',
        tags: ['Groups'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'user_ids'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Ekipa'),
                    new OA\Property(property: 'description', type: 'string', nullable: true),
                    new OA\Property(
                        property: 'user_ids',
                        type: 'array',
                        items: new OA\Items(type: 'integer'),
                        description: 'ID-jevi ostalih članova (vlasnik se automatski dodaje)'
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Grupa napravljena, vraća se kao conversation objekat'),
            new OA\Response(response: 422, description: 'Validacija nije prošla'),
        ]
    )]
    public function store(StoreGroupRequest $request)
    {
        $data = $request->validated();

        $group = Group::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'owner_id' => auth()->id(),
        ]);

        $group->users()->sync([...$data['user_ids'], auth()->id()]);

        return response()->json($group->fresh()->toConversationArray());
    }

    #[OA\Put(
        path: '/group/{group}',
        summary: 'Izmeni grupu (naziv, opis, članovi) — samo vlasnik sme',
        tags: ['Groups'],
        parameters: [
            new OA\Parameter(name: 'group', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'user_ids'],
                properties: [
                    new OA\Property(property: 'name', type: 'string'),
                    new OA\Property(property: 'description', type: 'string', nullable: true),
                    new OA\Property(
                        property: 'user_ids',
                        type: 'array',
                        items: new OA\Items(type: 'integer'),
                        description: 'Kompletna nova lista članova (zamenjuje staru, vlasnik ostaje uvek)'
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Grupa izmenjena, vraća se kao conversation objekat'),
            new OA\Response(response: 403, description: 'Nisi vlasnik ove grupe'),
            new OA\Response(response: 422, description: 'Validacija nije prošla'),
        ]
    )]
    public function update(UpdateGroupRequest $request, Group $group)
    {
        if ($group->owner_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validated();

        $group->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
        ]);

        $group->users()->sync([...$data['user_ids'], $group->owner_id]);

        return response()->json($group->fresh()->toConversationArray());
    }

    #[OA\Delete(
        path: '/group/{group}',
        summary: 'Obriši grupu, uključno sa svim njenim porukama i prilozima — samo vlasnik sme',
        tags: ['Groups'],
        parameters: [
            new OA\Parameter(name: 'group', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 204, description: 'Grupa obrisana'),
            new OA\Response(response: 403, description: 'Nisi vlasnik ove grupe'),
        ]
    )]
    public function destroy(Group $group)
    {
        if ($group->owner_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $groupId = $group->id;

        $messages = Message::where('group_id', $groupId)->get();

        foreach ($messages as $message) {
            foreach ($message->attachments as $attachment) {
                Storage::disk('public')->deleteDirectory(dirname($attachment->path));
                $attachment->delete();
            }
        }

        $group->update(['last_message_id' => null]);

        Message::where('group_id', $groupId)->delete();

        $group->delete();

        GroupDeleted::dispatch($groupId);

        return response('', 204);
    }

    #[OA\Put(
        path: '/group/{group}/members/{user}',
        summary: 'Postavi ili skini grupnog admina — samo vlasnik grupe sme',
        tags: ['Groups'],
        parameters: [
            new OA\Parameter(name: 'group', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'user', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['is_admin'],
                properties: [new OA\Property(property: 'is_admin', type: 'boolean')]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Status grupnog admina promenjen'),
            new OA\Response(response: 403, description: 'Nisi vlasnik ove grupe'),
            new OA\Response(response: 422, description: 'Ne može se ciljati vlasnik'),
        ]
    )]
    public function updateMember(Request $request, Group $group, User $user)
    {
        if ($group->owner_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($user->id === $group->owner_id) {
            return response()->json(['message' => 'Owner is already in charge of the group'], 422);
        }

        $data = $request->validate(['is_admin' => 'required|boolean']);

        $group->users()->updateExistingPivot($user->id, ['is_admin' => $data['is_admin']]);

        return response()->json($group->fresh()->toConversationArray());
    }

    #[OA\Delete(
        path: '/group/{group}/members/{user}',
        summary: 'Ukloni člana iz grupe — vlasnik (bilo koga) ili grupni admin (samo obične članove)',
        tags: ['Groups'],
        parameters: [
            new OA\Parameter(name: 'group', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'user', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Član uklonjen, vraća se ažurirana grupa'),
            new OA\Response(response: 403, description: 'Nemaš dozvolu da ukloniš ovog člana'),
        ]
    )]
    public function removeMember(Group $group, User $user)
    {
        $currentUser = auth()->user();
        $isOwner = $group->owner_id === $currentUser->id;

        if ($user->id === $group->owner_id) {
            return response()->json(['message' => 'Cannot remove the owner from the group'], 403);
        }

        if (!$isOwner) {
            $targetIsGroupAdmin = $group->users()
                ->wherePivot('user_id', $user->id)
                ->wherePivot('is_admin', true)
                ->exists();

            if (!$group->isOwnerOrGroupAdmin($currentUser) || $targetIsGroupAdmin) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $group->users()->detach($user->id);

        GroupMemberRemoved::dispatch($group->id, $user->id);

        return response()->json($group->fresh()->toConversationArray());
    }
}
