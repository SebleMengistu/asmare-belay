<template>
  <section class="mx-auto max-w-xl px-4 py-24 text-center">
    <p class="text-6xl font-black tracking-tight text-indigo-600">404</p>
    <h1 class="mt-4 text-2xl font-bold text-slate-900">Page not found</h1>
    <p class="mt-2 text-slate-500">The page you are looking for doesn't exist or was moved.</p>
    <RouterLink
      :to="{ name: 'home' }"
      class="mt-8 inline-block rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
    >
      Back to home
    </RouterLink>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useSeo } from '../composables/useSeo'

useSeo({
  title: 'Page not found',
  description: 'The requested page does not exist.',
  robots: 'noindex, nofollow',
})
</script>
