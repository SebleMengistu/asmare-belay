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
  <div class="mx-auto max-w-3xl space-y-8">
    <header class="text-center sm:text-left">
      <p class="eyebrow">Say hello</p>
      <h1 class="section-title">Let's build something together</h1>
      <p class="mt-2 max-w-xl text-slate-600">
        Have a project, role, or question? Send a message — I usually reply within a day.
      </p>
    </header>

    <div v-if="success" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
      ✓ {{ success }}
    </div>
    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</div>

    <form novalidate class="card space-y-5 !p-6 sm:!p-8" @submit.prevent="submit">
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="block space-y-1.5">
          <span class="label">Name *</span>
          <input v-model="form.name" type="text" required placeholder="tefera alagaw" class="input" />
          <span v-if="fieldErrors.name" class="block text-xs font-medium text-red-600">{{ fieldErrors.name[0] }}</span>
        </label>

        <label class="block space-y-1.5">
          <span class="label">Email *</span>
          <input v-model="form.email" type="email" required placeholder="tefera@gmail.com" class="input" />
          <span v-if="fieldErrors.email" class="block text-xs font-medium text-red-600">{{ fieldErrors.email[0] }}</span>
        </label>
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        <label class="block space-y-1.5">
          <span class="label">Phone <span class="font-normal text-slate-400">(optional)</span></span>
          <input v-model="form.phone" type="tel" placeholder="+251 …" class="input" />
        </label>

        <label class="block space-y-1.5">
          <span class="label">Subject</span>
          <input v-model="form.subject" type="text" placeholder="Odoo consultation, Laravel project…" class="input" />
        </label>
      </div>

      <label class="block space-y-1.5">
        <span class="label">Message *</span>
        <textarea v-model="form.message" rows="6" required placeholder="Tell me a little about what you need…" class="input resize-y"></textarea>
        <span v-if="fieldErrors.message" class="block text-xs font-medium text-red-600">{{ fieldErrors.message[0] }}</span>
      </label>

      <button type="submit" :disabled="submitting" class="btn-primary w-full">
        {{ submitting ? 'Sending…' : 'Send message ✈' }}
      </button>
      <p class="text-center text-xs text-slate-400">Your details are used only to respond to your enquiry.</p>
    </form>
  </div>
</template>
