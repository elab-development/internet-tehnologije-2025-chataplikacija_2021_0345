# ChatApp

Laravel + React (Inertia) chat aplikacija sa privicima, grupama i real-time porukama (Laravel Reverb).

## Pokretanje preko Dockera

Potreban je samo Docker i Docker Compose (Docker Desktop na Windows-u/Mac-u već ih uključuje).

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

## API dokumentacija (Swagger / OpenAPI)

Nakon pokretanja, interaktivna dokumentacija API-ja je dostupna na:

[http://localhost:8000/api/documentation](http://localhost:8000/api/documentation)

Pokriva sve JSON API endpoint-e aplikacije: slanje/brisanje poruka i prilozi (`/message`), upravljanje grupama (`/group`) i listu korisnika (`/users`). Sirovi OpenAPI spec fajl (generisan iz anotacija u kodu, `app/Http/Controllers/*.php`) se nalazi na `storage/api-docs/api-docs.json` i regeneriše se automatski pri svakom pokretanju.

Napomena: ove rute koriste sesijsko logovanje (kao i ceo sajt), ne API token, pa "Try it out" dugme u Swagger UI-ju radi za GET rute samo ako si već ulogovana u istom browseru; za POST/PUT/DELETE rute dokumentacija je i dalje potpuna, ali live-test iz same Swagger stranice blokira Laravel-ova CSRF zaštita.

---

<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
