<script setup>
import { reactive, ref } from 'vue'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'

useSeo({
  title: 'Contact',
  description: 'Get in touch about Odoo projects, development work or research collaboration.',
})

const form = reactive({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
})

const submitting = ref(false)
const success = ref('')
const error = ref('')
const fieldErrors = ref({})

function validate() {
  fieldErrors.value = {}
  if (!form.name.trim()) fieldErrors.value.name = ['Your name is required.']
  if (!form.email.trim()) fieldErrors.value.email = ['An email address is required.']
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) fieldErrors.value.email = ['Enter a valid email address.']
  if (form.message.trim().length < 10) fieldErrors.value.message = ['Please write at least 10 characters.']

  return Object.keys(fieldErrors.value).length === 0
}

async function submit() {
  success.value = ''
  error.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    const res = await http.post('/contact', { ...form })
    success.value = res.message || 'Thanks! Your message has been received.'
    form.name = ''
    form.email = ''
    form.phone = ''
    form.subject = ''
    form.message = ''
    // Fire-and-forget analytics ping; failures must never surface to the user.
    http.post('/analytics', { event: 'contact_form_submit', path: '/contact' }).catch(() => {})
  } catch (e) {
    error.value = e.message
    if (e.status === 422 && e.errors) fieldErrors.value = e.errors
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl space-y-8">
    <header>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Contact</h1>
      <p class="text-sm text-slate-500">Have a project, role, or question? Send a message — I usually reply within a day.</p>
    </header>

    <div v-if="success" class="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">{{ success }}</div>
    <div v-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <form novalidate class="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm" @submit.prevent="submit">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block space-y-1">
          <span class="text-sm font-medium text-slate-700">Name *</span>
          <input
            v-model="form.name"
            type="text"
            required
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <span v-if="fieldErrors.name" class="block text-xs text-red-600">{{ fieldErrors.name[0] }}</span>
        </label>

        <label class="block space-y-1">
          <span class="text-sm font-medium text-slate-700">Email *</span>
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <span v-if="fieldErrors.email" class="block text-xs text-red-600">{{ fieldErrors.email[0] }}</span>
        </label>
      </div>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-slate-700">Phone (optional)</span>
        <input
          v-model="form.phone"
          type="tel"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </label>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-slate-700">Subject</span>
        <input
          v-model="form.subject"
          type="text"
          placeholder="Odoo consultation, Laravel project…"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </label>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-slate-700">Message *</span>
        <textarea
          v-model="form.message"
          rows="5"
          required
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        ></textarea>
        <span v-if="fieldErrors.message" class="block text-xs text-red-600">{{ fieldErrors.message[0] }}</span>
      </label>

      <button
        type="submit"
        :disabled="submitting"
        class="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {{ submitting ? 'Sending…' : 'Send message' }}
      </button>
    </form>
  </div>
</template>
