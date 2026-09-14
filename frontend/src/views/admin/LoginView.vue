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
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <form
      novalidate
      class="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-8 shadow-sm"
      @submit.prevent="submit"
    >
      <div class="space-y-1">
        <h1 class="text-lg font-semibold text-slate-900">Admin Login</h1>
        <p class="text-sm text-slate-500">Sign in with your admin credentials.</p>
      </div>

      <div v-if="error" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{{ error }}</div>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-slate-700">Email</span>
        <input
          v-model="form.email"
          type="email"
          required
          autocomplete="username"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
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
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
        <span v-if="fieldErrors.password" class="block text-xs text-red-600">{{ fieldErrors.password[0] }}</span>
      </label>

      <button
        type="submit"
        :disabled="submitting"
        class="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {{ submitting ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
  </div>
</template>
