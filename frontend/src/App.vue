<template>
  <div class="flex min-h-screen flex-col">
    <header v-if="showChrome" class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <RouterLink to="/" class="text-lg font-bold tracking-tight text-slate-900">
          TEFERA
        </RouterLink>
        <nav class="flex gap-5 text-sm font-medium">
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/projects">Projects</RouterLink>
          <RouterLink to="/posts">Posts</RouterLink>
          <RouterLink to="/services">Services</RouterLink>
          <RouterLink to="/contact">Contact</RouterLink>
          <RouterLink to="/admin">Admin</RouterLink>
        </nav>
      </div>
    </header>

    <main :class="showChrome ? 'mx-auto w-full max-w-5xl flex-1 px-4 py-8' : 'flex-1'">
      <RouterView />
    </main>

    <footer v-if="showChrome" class="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
      © {{ new Date().getFullYear() }} TEFERA Portfolio System
    </footer>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import http from './api/http'

const route = useRoute()
const showChrome = computed(() => route.meta.chrome !== false)

// Lightweight page-view tracking against /api/v1/analytics. Silent by design:
// telemetry must never break or surface in the UX.
watch(
  () => route.fullPath,
  (path) => {
    http
      .post('/analytics', {
        event: 'page_view',
        path,
        referrer: document.referrer || undefined,
      })
      .catch(() => {})
  },
  { immediate: true },
)
</script>