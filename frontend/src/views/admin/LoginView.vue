<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const form = reactive({ email: '', password: '' })
const submitting = ref(false)
const error = ref('')
const fieldErrors = ref({})

async function submit() {
  error.value = ''
  fieldErrors.value = {}
  submitting.value = true

  try {
    await auth.login(form.email.trim(), form.password)
    router.push(typeof route.query.redirect === 'string' ? route.query.redirect : { name: 'admin.dashboard' })
  } catch (e) {
    error.value = e.message
    if (e.status === 422 && e.errors) fieldErrors.value = e.errors
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-100 px-4">
    <form
      novalidate
      class="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
      @submit.prevent="submit"
    >
      <div class="space-y-1 text-center">
        <h1 class="text-xl font-bold tracking-tight text-slate-900">TEFERA Admin</h1>
        <p class="text-xs uppercase tracking-widest text-slate-400">Sign in to continue</p>
      </div>

      <div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</div>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-slate-700">Email</span>
        <input
          v-model="form.email"
          type="email"
          required
          autocomplete="username"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <span v-if="fieldErrors.email" class="block text-xs text-red-600">{{ fieldErrors.email[0] }}</span>
      </label>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-slate-700">Password</span>
        <input
          v-model="form.password"
          type="password"
          required
          autocomplete="current-password"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <span v-if="fieldErrors.password" class="block text-xs text-red-600">{{ fieldErrors.password[0] }}</span>
      </label>

      <button
        type="submit"
        :disabled="submitting"
        class="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {{ submitting ? 'Signing in…' : 'Sign in' }}
      </button>

      <p class="text-center text-xs text-slate-400">
        Credentials are seeded via ADMIN_EMAIL / ADMIN_PASSWORD.
      </p>
    </form>
  </div>
</template>
