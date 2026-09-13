<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: "1.0.0",
    title: "ChatApp API",
    description: "API dokumentacija za chat aplikaciju: slanje/brisanje poruka sa prilozima, upravljanje grupama i lista korisnika. Rute su zaštićene sesijom (login preko browsera), ne API tokenom."
)]
#[OA\Server(url: "/", description: "Aktivni server")]
abstract class Controller
{
    //
}
