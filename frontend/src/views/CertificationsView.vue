<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'

useSeo({
  title: 'Certifications',
  description: 'Professional certifications and credentials earned by Tefera Alagaw.',
})

const loading = ref(true)
const error = ref('')
const certifications = ref([])
const lightbox = ref('')
const lightboxName = ref('')

function openLightbox(cert) {
  lightbox.value = cert.image
  lightboxName.value = cert.name
  document.body.classList.add('overflow-hidden')
}

function closeLightbox() {
  lightbox.value = ''
  lightboxName.value = ''
  document.body.classList.remove('overflow-hidden')
}

function onKeydown() {
  if (event.key === 'Escape') closeLightbox()
}

const ordered = computed(() =>
  [...certifications.value].sort((a, b) => {
    const aDate = a.issued_date || a.expiry_date || ''
    const bDate = b.issued_date || b.expiry_date || ''
    return String(bDate).localeCompare(String(aDate))
  }),
)

const total = computed(() => ordered.value.length)

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })

function formatDate(date) {
  return date ? dateFormatter.format(new Date(date)) : ''
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/skills')
    certifications.value = res.data.certifications ?? []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="space-y-8">
    <header
      class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-brand-950 px-6 py-10 shadow-xl shadow-navy-950/30 sm:px-10"
    >
      <div class="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl" />
      <div class="relative">
        <p class="eyebrow !text-accent-400">Credentials</p>
        <h1 class="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Certifications</h1>
        <p class="mt-2 text-sm text-slate-300">{{ loading ? 'Loading credentials…' : `${total} professional certification${total === 1 ? '' : 's'} earned.` }}</p>
      </div>
    </header>

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <div v-if="loading" class="grid gap-6 md:grid-cols-2">
      <div v-for="n in 4" :key="n" class="card space-y-4">
        <div class="skeleton h-5 w-40" />
        <div class="skeleton h-4 w-full" />
        <div class="skeleton h-4 w-2/3" />
      </div>
    </div>

    <div v-else-if="ordered.length" class="grid gap-6 md:grid-cols-2">
      <div
        v-for="cert in ordered"
        :key="cert.id"
        class="card card-hover group relative flex flex-col overflow-hidden p-6"
      >
        <div
          class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 to-accent-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />

        <div class="flex items-start justify-between gap-4">
          <span
            class="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-100 text-brand-600 dark:bg-white/5 dark:text-brand-400"
          >
                        <img
              v-if="cert.image"
              :src="cert.image"
              :alt="cert.name"
              class="h-full w-full object-contain p-1.5"
              @click="openLightbox(cert)"
            />
            <svg v-else viewBox="0 0 24 24" class="h-6 w-6 fill-current" aria-hidden="true">
              <path d="M12 2 15 8.3l7 .8-5.2 4.6L18.3 20 12 16.4 5.7 20l1.5-6.3L2 9.1l7-.8z" />
            </svg>
          </span>
          <p v-if="formatDate(cert.issued_date)" class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
            {{ formatDate(cert.issued_date) }}
          </p>
        </div>

        <h2 class="mt-5 font-display text-base font-bold text-navy-900 dark:text-white">{{ cert.name }}</h2>
        <p v-if="cert.issuer" class="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
          <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current stroke-2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          {{ cert.issuer }}
        </p>

        <p v-if="cert.credential_id" class="mt-1 text-xs text-slate-400">Credential ID: {{ cert.credential_id }}</p>

        <div v-if="cert.skills?.length" class="mt-4 flex flex-wrap gap-1.5">
          <span
            v-for="skill in cert.skills"
            :key="skill"
            class="chip !border-brand-100 !bg-brand-50/80 !text-brand-700 dark:!border-brand-500/30 dark:!bg-brand-600/15 dark:!text-brand-300"
          >
            {{ skill }}
          </span>
        </div>

        <div v-if="cert.expiry_date" class="mt-3 text-xs text-slate-400">
          Valid until {{ formatDate(cert.expiry_date) }}
        </div>

        <a
          v-if="cert.credential_url"
          :href="cert.credential_url"
          target="_blank"
          rel="noopener"
          class="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand-600 transition hover:gap-2 dark:text-brand-400"
        >
          Verify credential ↗
        </a>
      </div>
    </div>

    <p v-else class="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
      No certifications published yet.
    </p>
  </div>

  <!-- Certification lightbox -->
  <div
    v-if="lightbox"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-label="Certification image preview"
    @click="closeLightbox"
  >
    <button
      class="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
      aria-label="Close preview"
      @click="closeLightbox"
    >
      <svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current stroke-2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
    <figure class="max-w-3xl">
      <img :src="lightbox" :alt="lightboxName" class="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl" />
      <figcaption class="mt-3 text-center text-sm font-semibold text-slate-200">{{ lightboxName }}</figcaption>
    </figure>
  </div>
</template>