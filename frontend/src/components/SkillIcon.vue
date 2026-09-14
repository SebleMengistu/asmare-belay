<script setup>
import { computed, ref } from 'vue'

/**
 * Renders a technology logo from the Devicon CDN with a graceful
 * letter-tile fallback (no network, unknown tech, or broken image).
 */
const props = defineProps({
  name: { type: String, required: true },
  tileClass: { type: String, default: '' },
})

const failed = ref(false)

const ICONS = {
  laravel: 'laravel/laravel-original',
  'vue.js': 'vuejs/vuejs-original',
  vuejs: 'vuejs/vuejs-original',
  javascript: 'javascript/javascript-original',
  js: 'javascript/javascript-original',
  typescript: 'typescript/typescript-original',
  php: 'php/php-original',
  python: 'python/python-original',
  postgresql: 'postgresql/postgresql-original',
  mysql: 'mysql/mysql-original',
  git: 'git/git-original',
  docker: 'docker/docker-original',
  'tailwind css': 'tailwindcss/tailwindcss-original',
  tailwindcss: 'tailwindcss/tailwindcss-original',
  bootstrap: 'bootstrap/bootstrap-original',
  linux: 'linux/linux-original',
  aws: 'amazonwebservices/amazonwebservices-original-wordmark',
  github: 'github/github-original',
  html5: 'html5/html5-original',
  css3: 'css3/css3-original',
  nodejs: 'nodejs/nodejs-original',
  flutter: 'flutter/flutter-original',
  dart: 'dart/dart-original',
  figma: 'figma/figma-original',
  redis: 'redis/redis-original',
}

const TILE_COLORS = {
  laravel: '#FF2D20',
  'vue.js': '#42B883',
  vuejs: '#42B883',
  javascript: '#F7DF1E',
  js: '#F7DF1E',
  typescript: '#3178C6',
  php: '#777BB3',
  python: '#3776AB',
  postgresql: '#336791',
  mysql: '#00618A',
  git: '#F05033',
  docker: '#2496ED',
  'tailwind css': '#38BDF8',
  tailwindcss: '#38BDF8',
  bootstrap: '#7952B3',
  linux: '#111111',
  aws: '#FF9900',
  github: '#181717',
  html5: '#E34F26',
  css3: '#1572B6',
  nodejs: '#339933',
  flutter: '#02569B',
  dart: '#0175C2',
  figma: '#F24E1E',
  redis: '#DC382D',
}

const key = computed(() => props.name.trim().toLowerCase())
const iconPath = computed(() => ICONS[key.value])
const isOdoo = computed(() => key.value === 'odoo')
const fallbackColor = computed(() => TILE_COLORS[key.value] || '#2563eb')
const fallbackLabel = computed(() => {
  const words = props.name.trim().split(/\s+/)
  return (words.length > 1 ? words.map((w) => w[0]).join('') : props.name.trim().slice(0, 2)).toUpperCase()
})
const url = computed(() =>
  iconPath.value ? `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${iconPath.value}.svg` : '',
)
</script>

<template>
  <!-- Odoo gets a bespoke wordmark tile (no reliable generic icon exists). -->
  <span
    v-if="isOdoo"
    class="grid place-items-center rounded-md bg-[#714B67] font-display font-bold text-white"
    :class="tileClass"
    style="aspect-ratio: 1"
  >
    <span class="flex items-baseline" style="font-size: 62%; line-height: 1">
      odoo<span class="ml-0.5 inline-block h-2 w-2 rounded-full bg-white" style="width: 0.45em; height: 0.45em" />
    </span>
  </span>

  <img
    v-else-if="url && !failed"
    :src="url"
    :alt="name"
    loading="lazy"
    class="object-contain"
    :class="tileClass"
    @error="failed = true"
  />

  <span
    v-else
    class="grid place-items-center rounded-md font-display font-bold text-white"
    :class="tileClass"
    :style="{ backgroundColor: fallbackColor, aspectRatio: '1' }"
  >
    {{ fallbackLabel }}
  </span>
</template>
