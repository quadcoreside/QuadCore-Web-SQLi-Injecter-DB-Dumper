# INTENTIONALLY VULNERABLE — local integration-test fixture only.
#
# Serves a single classic UNION-injectable endpoint (`index.php`) so QuadCore
# SQLi's detection/exploitation code can be exercised end-to-end against a real
# (but disposable) target. Only started via `docker compose --profile test up`.
# Never expose this outside an isolated local environment.

FROM php:8.2-apache

RUN docker-php-ext-install mysqli

COPY index.php /var/www/html/index.php

EXPOSE 80
