<template>
  <div class="flex min-h-screen bg-slate-100">
    <aside class="flex w-60 flex-col border-r border-slate-800 bg-slate-900 text-slate-200">
      <div class="flex items-center gap-2.5 px-5 py-5">
        <img src="/favicon.svg" alt="TEFERA logo" class="h-9 w-9 shrink-0 rounded-full" />
        <div>
          <p class="text-lg font-bold tracking-tight text-white">TEFERA</p>
          <p class="text-xs uppercase tracking-widest text-slate-500">Admin</p>
        </div>
      </div>

      <nav class="flex flex-col gap-1 px-3">
        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800"
          active-class=""
          :exact-active-class="'bg-brand-600 text-white'"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="mt-auto space-y-2 px-4 py-4 text-xs">
        <div v-if="auth.user" class="rounded-md bg-slate-800 p-3">
          <p class="font-semibold text-white">{{ auth.user.name }}</p>
          <p class="truncate text-slate-400">{{ auth.user.email }}</p>
          <p v-if="auth.user.roles?.length" class="mt-1 text-emerald-400">{{ auth.user.roles.join(', ') }}</p>
        </div>
        <button
          type="button"
          class="w-full rounded-md border border-slate-700 px-3 py-2 text-left font-medium text-slate-300 hover:bg-slate-800"
          @click="signOut"
        >
          Log out
        </button>
      </div>
    </aside>

    <main class="flex-1 overflow-x-hidden p-8">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const items = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Profile', to: '/admin/profile' },
  { label: 'Projects', to: '/admin/projects' },
  { label: 'Blog', to: '/admin/posts' },
  { label: 'Skills', to: '/admin/skills' },
  { label: 'Experience', to: '/admin/experiences' },
  { label: 'Education', to: '/admin/educations' },
  { label: 'Certifications', to: '/admin/certifications' },
  { label: 'Publications', to: '/admin/publications' },
  { label: 'Services', to: '/admin/services' },
  { label: 'Testimonials', to: '/admin/testimonials' },
  { label: 'Messages', to: '/admin/messages' },
  { label: 'Feedback', to: '/admin/feedback' },
  { label: 'Media', to: '/admin/media' },
]

async function signOut() {
  await auth.logout()
  router.push({ name: 'admin.login' })
}
</script>
