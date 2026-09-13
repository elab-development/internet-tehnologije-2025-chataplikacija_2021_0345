<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
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
            ->when(!auth()->user()->is_admin, function ($query) {
                $query->whereNull('blocked_at');
            })
            ->orderBy('name')
            ->get();

        return UserResource::collection($users);
    }
}
