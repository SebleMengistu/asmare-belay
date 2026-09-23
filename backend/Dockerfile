# syntax=docker/dockerfile:1
# ASMARE Portfolio — Laravel 12 (PHP 8.2) production container
# Build context: ./backend

FROM php:8.2-apache

# ---- system deps + PHP extensions ----
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip zip curl \
        libzip-dev libsqlite3-dev \
        libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
        libicu-dev libonig-dev libxml2-dev libcurl4-openssl-dev \
        libsodium-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo pdo_sqlite mbstring exif intl zip opcache gd sodium \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

# ---- install Composer directly into this image ----
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# ---- PHP tuning ----
RUN { \
    echo 'memory_limit=512M'; \
    echo 'upload_max_filesize=64M'; \
    echo 'post_max_size=64M'; \
    echo 'max_execution_time=180'; \
    echo 'expose_php=Off'; \
  } > /usr/local/etc/php/conf.d/zz-asmare.ini

# ---- Apache: serve from public/ ----
RUN sed -ri \
    's#DocumentRoot /var/www/html#DocumentRoot /var/www/html/public#; s#<Directory /var/www/html>#<Directory /var/www/html/public>#' \
    /etc/apache2/sites-available/000-default.conf

# ---- copy source ----
COPY . .

# ---- install dependencies ----
RUN composer install --no-dev --no-interaction --no-progress --optimize-autoloader --prefer-dist

# ---- prepare storage & permissions ----
RUN mkdir -p bootstrap/cache storage/framework/cache/data storage/framework/sessions storage/framework/views \
 && php artisan storage:link --no-interaction || true \
 && chmod -R 775 storage bootstrap/cache \
 && chown -R www-data:www-data .

# ---- entrypoint ----
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["apache2-foreground"]
