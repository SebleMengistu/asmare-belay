# syntax=docker/dockerfile:1
# TEFERA Portfolio — Laravel 12 (PHP 8.2) production container
# Build context: ./backend

# ---- Stage 1: PHP + Apache base with all system deps ----
FROM php:8.2-apache AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip zip libzip-dev \
        libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
        libicu-dev libonig-dev libxml2-dev libcurl4-openssl-dev \
        libsqlite3-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo pdo_sqlite mbstring exif intl zip opcache gd \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

# ---- Stage 2: Composer dependency install ----
FROM composer:2 AS vendor-builder

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-progress --optimize-autoloader --prefer-dist

# ---- Stage 3: Runtime image ----
FROM base

WORKDIR /var/www/html

# PHP tuning
RUN { \
    echo 'memory_limit=512M'; \
    echo 'upload_max_filesize=64M'; \
    echo 'post_max_size=64M'; \
    echo 'max_execution_time=180'; \
    echo 'expose_php=Off'; \
  } > /usr/local/etc/php/conf.d/zz-tefera.ini

# Apache: point DocumentRoot at public/
RUN sed -ri \
    's#DocumentRoot /var/www/html#DocumentRoot /var/www/html/public#; s#<Directory /var/www/html>#<Directory /var/www/html/public>#' \
    /etc/apache2/sites-available/000-default.conf

# Copy application source (build context is ./backend)
COPY . .

# Copy vendor from builder stage (has all composer deps)
COPY --from=vendor-builder /app/vendor ./vendor

# Prepare storage dirs and permissions
RUN mkdir -p bootstrap/cache storage/framework/cache/data storage/framework/sessions storage/framework/views \
 && chmod -R 775 storage bootstrap/cache \
 && chown -R www-data:www-data .

# Entrypoint
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["apache2-foreground"]
