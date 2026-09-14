<script setup>
import { reactive, ref } from 'vue'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'

useSeo({
  title: 'Feedback',
  description: 'Share your thoughts on a project, article or collaboration.',
})

const form = reactive({
  name: '',
  email: '',
  category: '',
  rating: 0,
  message: '',
})

const submitting = ref(false)
const success = ref('')
const error = ref('')
const fieldErrors = ref({})

const categories = ['General', 'Project', 'Article', 'Odoo', 'Teaching', 'Research', 'Other']

function validate() {
  fieldErrors.value = {}
  if (form.message.trim().length < 5) fieldErrors.value.message = ['Please write at least 5 characters.']
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    fieldErrors.value.email = ['Enter a valid email address.']
  }
  return Object.keys(fieldErrors.value).length === 0
}

async function submit() {
  success.value = ''
  error.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    const res = await http.post('/feedback', {
      name: form.name || null,
      email: form.email || null,
      category: form.category || null,
      rating: form.rating || null,
      message: form.message,
    })
    success.value = res.message || 'Thanks for your feedback!'
    form.name = ''
    form.email = ''
    form.category = ''
    form.rating = 0
    form.message = ''
    http.post('/analytics', { event: 'feedback_submit', path: '/feedback' }).catch(() => {})
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
      <p class="eyebrow">Feedback</p>
      <h1 class="section-title">What did you think?</h1>
      <p class="mt-2 max-w-xl text-slate-600">
        Your input helps improve the work. Feedback is optional — you can share it anonymously.
      </p>
    </header>

    <div v-if="success" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
      ✓ {{ success }}
    </div>
    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</div>

    <form novalidate class="card space-y-5 !p-6 sm:!p-8" @submit.prevent="submit">
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="block space-y-1.5">
          <span class="label">Name <span class="font-normal text-slate-400">(optional)</span></span>
          <input v-model="form.name" type="text" placeholder="Jane Doe" class="input" />
        </label>

        <label class="block space-y-1.5">
          <span class="label">Email <span class="font-normal text-slate-400">(optional)</span></span>
          <input v-model="form.email" type="email" placeholder="jane@company.com" class="input" />
          <span v-if="fieldErrors.email" class="block text-xs font-medium text-red-600">{{ fieldErrors.email[0] }}</span>
        </label>
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        <label class="block space-y-1.5">
          <span class="label">Category <span class="font-normal text-slate-400">(optional)</span></span>
          <select v-model="form.category" class="input">
            <option value="" disabled>Select a category…</option>
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>

        <fieldset class="block space-y-1.5">
          <legend class="label">Rating <span class="font-normal text-slate-400">(optional)</span></legend>
          <div class="flex items-center gap-1 text-2xl">
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              class="text-amber-400 transition hover:scale-110"
              :class="form.rating >= n ? '' : 'opacity-30'"
              :aria-label="`Rate ${n} of 5`"
              @click="form.rating = form.rating === n ? 0 : n"
            >
              ★
            </button>
          </div>
        </fieldset>
      </div>

      <label class="block space-y-1.5">
        <span class="label">Message *</span>
        <textarea v-model="form.message" rows="6" required placeholder="Share your thoughts…" class="input resize-y"></textarea>
        <span v-if="fieldErrors.message" class="block text-xs font-medium text-red-600">{{ fieldErrors.message[0] }}</span>
      </label>

      <button type="submit" :disabled="submitting" class="btn-primary w-full">
        {{ submitting ? 'Submitting…' : 'Submit feedback' }}
      </button>
      <p class="text-center text-xs text-slate-400">Feedback is used only to improve the portfolio and its content.</p>
    </form>
  </div>
</template>
