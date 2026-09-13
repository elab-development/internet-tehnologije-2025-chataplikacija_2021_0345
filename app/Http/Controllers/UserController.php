<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class UserController extends Controller
{
    #[OA\Get(
        path: '/users',
        summary: 'Lista svih korisnika osim trenutno ulogovanog (za biranje članova grupe)',
        tags: ['Users'],
        responses: [
            new OA\Response(response: 200, description: 'Lista korisnika'),
        ]
    )]
    public function index()
    {
        $users = User::where('id', '!=', auth()->id())
            ->when(!auth()->user()->canModerate(), function ($query) {
                $query->whereNull('blocked_at');
            })
            ->orderBy('name')
            ->get();

        return UserResource::collection($users);
    }

    #[OA\Post(
        path: '/user/{user}/block-unblock',
        summary: 'Blokiraj ili odblokiraj korisnika (moderator ili admin)',
        tags: ['Users'],
        parameters: [
            new OA\Parameter(name: 'user', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Status blokiranosti promenjen'),
            new OA\Response(response: 403, description: 'Nemaš dozvolu za ovu akciju'),
        ]
    )]
    public function blockUnblock(User $user)
    {
        if (!auth()->user()->canModerate()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $user->update(['blocked_at' => $user->blocked_at ? null : now()]);

        return response()->json([
            'message' => $user->blocked_at ? 'User blocked' : 'User unblocked',
        ]);
    }

    #[OA\Post(
        path: '/user/{user}/change-role',
        summary: 'Promeni ulogu korisnika (samo admin)',
        tags: ['Users'],
        parameters: [
            new OA\Parameter(name: 'user', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['role'],
                properties: [
                    new OA\Property(property: 'role', type: 'string', enum: ['user', 'moderator', 'admin']),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Uloga promenjena'),
            new OA\Response(response: 403, description: 'Nemaš dozvolu za ovu akciju'),
            new OA\Response(response: 422, description: 'Nepoznata uloga'),
        ]
    )]
    public function changeRole(Request $request, User $user)
    {
        if (!auth()->user()->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'role' => 'required|in:' . implode(',', array_column(UserRole::cases(), 'value')),
        ]);

        $user->update(['role' => $data['role']]);

        return response()->json(['message' => 'Role updated successfully']);
    }
}
