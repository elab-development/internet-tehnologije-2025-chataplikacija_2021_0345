# ChatApp

Real-time chat aplikacija — privatne poruke, grupni razgovori, prilozi (slike/video/PDF/fajlovi), uloge korisnika i uloge unutar grupa. Rađeno u Laravel + React (Inertia) stack-u, sa Laravel Reverb-om za real-time deo.

## Tehnologije

| Sloj | Tehnologije |
|---|---|
| Frontend | React 18, Inertia.js 2 (bez odvojenog REST poziva za navigaciju), Tailwind CSS 3 + daisyUI |
| Backend | Laravel 13 (PHP 8.3+) |
| Real-time | Laravel Reverb (WebSocket server), Laravel Echo (klijent) |
| Baza podataka | MySQL 8 |
| API dokumentacija | L5-Swagger (OpenAPI 3) |
| Testiranje | Pest |
| Kontejnerizacija | Docker, Docker Compose |

## Glavne funkcionalnosti

- Privatni razgovori (1-na-1) i grupni razgovori, real-time preko WebSocket-a (bez ručnog refresh-a)
- Slanje priloga (slike, video, PDF, ostali fajlovi) uz preview pre slanja i lightbox pregled/download nakon slanja
- Brisanje sopstvenih poruka (sa čišćenjem priloga sa diska), markdown formatiranje poruka, emoji picker
- Kreiranje/izmena/brisanje grupa, upravljanje članovima
- Dve nezavisne hijerarhije ovlašćenja:
  - **Sajt-wide uloge korisnika**: `user` / `moderator` / `admin` — moderator i admin mogu da blokiraju korisnike, samo admin menja uloge
  - **Uloga unutar grupe**: vlasnik grupe i (opciono) grupni admin kog vlasnik postavi — grupni admin sme da uklanja obične članove, ali ne i da briše grupu ili postavlja druge admine
- Toast notifikacije za sve bitne akcije (poslata/obrisana poruka, promena uloge, brisanje grupe, uklanjanje iz grupe...), uključujući real-time obaveštenja kad se nešto desi dok gledaš drugi razgovor
- Online status korisnika

## Struktura projekta

```
├── app/
│   ├── Enums/UserRole.php          # user / moderator / admin
│   ├── Events/                     # Broadcast eventi (SocketMessage, GroupDeleted...)
│   ├── Http/Controllers/           # MessageController, GroupController, UserController...
│   ├── Http/Requests/              # Form request validacija
│   ├── Http/Resources/             # JSON resursi (MessageResource, UserResource...)
│   └── Models/                     # User, Message, MessageAttachment, Conversation, Group
├── database/
│   ├── migrations/
│   └── seeders/DatabaseSeeder.php  # test korisnici, poruke, grupe
├── resources/
│   ├── js/
│   │   ├── Components/App/         # MessageInput, GroupModal, ToastContainer...
│   │   ├── Layouts/                # AuthenticatedLayout, ChatLayout
│   │   └── Pages/                  # Home, Auth/*, Profile/*
│   └── views/app.blade.php
├── routes/web.php
├── docker/entrypoint.sh
├── Dockerfile
└── docker-compose.yml
```

## Preduslovi

- Docker i Docker Compose — **ili**
- PHP 8.3+, Composer, Node.js 20+, MySQL 8 (za lokalno pokretanje bez Dockera)

## Pokretanje preko Dockera

```bash
docker compose up --build
```

Ovo podiže tri kontejnera:

- **app** — Laravel aplikacija, dostupna na [http://localhost:8000](http://localhost:8000)
- **reverb** — WebSocket server za real-time poruke, na portu 8080
- **mysql** — baza podataka

Pri prvom pokretanju se automatski rade migracije, `storage:link` i generisanje Swagger dokumentacije. Test podaci (korisnici, poruke, grupe) se ubacuju ručno, po potrebi:

```bash
docker compose exec app php artisan db:seed
```

Podaci u bazi i upload-ovani prilozi ostaju sačuvani između restarta (Docker volumeni) — brišu se samo sa `docker compose down -v`.

## Pokretanje bez Dockera

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
```

Podesi u `.env` konekciju ka svojoj MySQL bazi (`DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`) i Reverb kredencijale (`REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET` — proizvoljne vrednosti za lokalni rad), zatim:

```bash
php artisan migrate --seed
php artisan storage:link
```

Aplikacija zahteva **tri procesa da rade istovremeno**, u tri različita terminala:

```bash
php artisan serve            # backend, http://localhost:8000
npm run dev                  # Vite dev server (frontend build/HMR)
php artisan reverb:start     # WebSocket server za real-time poruke
```

### Ključne environment varijable

| Varijabla | Opis |
|---|---|
| `DB_*` | Konekcija ka MySQL bazi |
| `BROADCAST_CONNECTION=reverb` | Real-time poruke idu preko Reverb-a |
| `REVERB_APP_ID` / `REVERB_APP_KEY` / `REVERB_APP_SECRET` | Kredencijali Reverb servera (proizvoljni za lokalni rad) |
| `VITE_REVERB_*` | Iste vrednosti, čita ih frontend (Echo) da se poveže na WebSocket |
| `FILESYSTEM_DISK` | Prilozi porukama se čuvaju na `public` disku (`storage/app/public`) |

### Test nalozi (nakon `php artisan db:seed`)

| Email | Lozinka | Uloga |
|---|---|---|
| `john@example.com` | `password` | admin |
| `jane@example.com` | `password` | user |

Ostalih 10 korisnika je generisano nasumično (Faker) radi popunjavanja liste razgovora — nemaju poznatu lozinku.

## Testiranje

Projekat koristi [Pest](https://pestphp.com/). Pokretanje:

```bash
php artisan test
```

Trenutno su pokriveni auth tokovi (login/register/reset lozinke/verifikacija email-a, iz Laravel Breeze scaffolding-a). Testovi za chat funkcionalnosti (autorizacija brisanja poruka, grupnih akcija, promene uloga) su u planu.

## Baza podataka — modeli

```
User ──< Message >── User (sender/receiver)
User ──< MessageAttachment (preko Message)
User >──< Group (preko group_users pivot tabele, sa is_admin flagom za grupnog admina)
Group ──< Message
User ──< Conversation >── User (user_id1/user_id2, za 1-na-1 razgovore)
```

| Model | Opis |
|---|---|
| `User` | Korisnik; `role` (user/moderator/admin), `blocked_at` |
| `Message` | Poruka; pripada korisniku ili grupi |
| `MessageAttachment` | Prilog uz poruku (slika/video/PDF/fajl) |
| `Conversation` | Prati poslednju poruku između dva korisnika (za sortiranje liste razgovora) |
| `Group` | Grupa; `owner_id`, članovi preko `group_users` pivot tabele |

## API dokumentacija (Swagger / OpenAPI)

Nakon pokretanja, interaktivna dokumentacija API-ja je dostupna na:

[http://localhost:8000/api/documentation](http://localhost:8000/api/documentation)

Pokriva sve JSON API endpoint-e aplikacije. Sirovi OpenAPI spec fajl (generisan iz anotacija u kodu, `app/Http/Controllers/*.php`) se nalazi na `storage/api-docs/api-docs.json` i regeneriše se automatski pri svakom pokretanju.

Napomena: ove rute koriste sesijsko logovanje (kao i ceo sajt), ne API token, pa "Try it out" dugme u Swagger UI-ju radi za GET rute samo ako si već ulogovana u istom browseru; za POST/PUT/DELETE rute dokumentacija je i dalje potpuna, ali live-test iz same Swagger stranice blokira Laravel-ova CSRF zaštita.

### Pregled ruta

| Metoda | Ruta | Opis |
|---|---|---|
| POST | `/message` | Pošalji poruku (tekst i/ili prilozi) |
| DELETE | `/message/{message}` | Obriši poruku (samo vlasnik) |
| GET | `/message/older/{message}` | Učitaj starije poruke (beskonačan skrol) |
| POST | `/group` | Napravi grupu |
| PUT | `/group/{group}` | Izmeni grupu (samo vlasnik) |
| DELETE | `/group/{group}` | Obriši grupu (samo vlasnik) |
| PUT | `/group/{group}/members/{user}` | Postavi/skini grupnog admina (samo vlasnik) |
| DELETE | `/group/{group}/members/{user}` | Ukloni člana (vlasnik ili grupni admin) |
| GET | `/users` | Lista korisnika (za biranje članova grupe) |
| POST | `/user/{user}/block-unblock` | Blokiraj/odblokiraj korisnika (moderator/admin) |
| POST | `/user/{user}/change-role` | Promeni ulogu korisnika (samo admin) |

Sve rute iznad zahtevaju prijavu (`auth` middleware).

## Bezbednost

| Zaštita | Kako je pokrivena |
|---|---|
| CSRF | Laravel-ova ugrađena CSRF zaštita za sve sesijske (POST/PUT/DELETE) zahteve |
| SQL Injection | Eloquent ORM — parametrizovani upiti svuda, nema raw SQL sa unetim podacima |
| XSS | React automatski escape-uje sav prikazani sadržaj; markdown poruke se renderuju preko `react-markdown` (bez `dangerouslySetInnerHTML`) |
| IDOR | Eksplicitne provere vlasništva na svakoj osetljivoj akciji — brisanje poruke (samo pošiljalac), izmena/brisanje grupe (samo vlasnik), uklanjanje člana (vlasnik ili grupni admin, sa proverom hijerarhije), promena uloge (samo admin) |

## Licenca

Ovaj projekat je razvijen u okviru predmeta Internet tehnologije na Fakultetu organizacionih nauka, Univerzitet u Beogradu.
