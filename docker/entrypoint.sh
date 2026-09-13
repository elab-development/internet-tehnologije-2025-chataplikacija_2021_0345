#!/bin/sh
set -e

case "$1" in
    serve)
        php artisan storage:link || true
        php artisan migrate --force
        php artisan l5-swagger:generate || true
        exec php artisan serve --host=0.0.0.0 --port=8000
        ;;
    reverb)
        exec php artisan reverb:start --host=0.0.0.0 --port=8080
        ;;
    *)
        exec "$@"
        ;;
esac
