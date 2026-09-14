# syntax=docker/dockerfile:1
# TEFERA Portfolio — Laravel 12 (PHP 8.2) production container
# Runtime: php:8.2-apache (mod_php — Laravel 12 is entirely compatible)

FROM php:8.2-apache AS base

# ---- system deps needed by Laravel 12 core + medialibrary ----
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip zip libzip-dev \
        libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
        libicu-dev libonig-dev libxml2-dev libcurl4-openssl-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo pdo_sqlite mbstring exif intl zip opcache gd \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

# ---- composer (official image as the builder) ----
FROM composer:2 AS composer-builder

# ---- runtime image ----
FROM base

WORKDIR /var/www/html

# 1) If installed, dump all PHP.ini recommendations minimal + security header.
RUN { \
    echo 'memory_limit=512M'; \
    echo 'upload_max_filesize=64M'; \
    echo 'post_max_size=64M'; \
    echo 'max_execution_time=180'; \
    echo 'expose_php=Off'; \
  } > /usr/local/etc/php/conf.d/zz-tefera.ini

# 2) Apache: point DOCROOT at public/ so routes reach index.php (SPA history + API).
RUN sed -ri 's#DocumentRoot /var/www/html#DocumentRoot /var/www/html/public#; s#<Directory /var/www/html>#<Directory /var/www/html/public>#' /etc/apache2/sites-available/000-default.conf \
 && sed -ri 's#/var/www/html/(.*)/??#/var/www/html/#' /dev/null 2>/dev/null || true

# 3) project files (respects .dockerignore → no vendor/ or .env leaks into image)
COPY . .

# 4) production vendor install (no dev deps, no scripts that need interactive tty)
RUN composer install --no-dev --no-interaction --no-progress --optimize-autoloader --prefer-dist \
 && php artisan storage:link --no-interaction || true \
 && mkdir -p bootstrap/cache storage/framework/cache/data storage/framework/sessions storage/framework/views \
 && chmod -R 775 storage bootstrap/cache \
 && chown -R www-data:www-data .

# 5) one-shot boot ritual (migrate + seed so the SPA never shows an empty portfolio)
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["apache2-foreground"]
