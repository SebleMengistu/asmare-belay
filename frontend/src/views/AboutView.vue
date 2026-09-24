<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import http from '../api/http'
import { useSeo } from '../composables/useSeo'
import { SOCIAL_PATHS, useSocials } from '../composables/useSocials'

useSeo({
  title: 'About',
  description:
    'Professional biography, career summary, research interests and quick contact information for Asmare Belay — Hydrology & Water Resources Engineer.',
})

const loading = ref(true)
const profile = ref(null)
const languages = ref([])

const paragraphs = computed(() =>
  String(profile.value?.bio || '')
    .split(/\n{1,}/)
    .map((p) => p.trim())
    .filter(Boolean),
)

const initials = computed(() =>
  String(profile.value?.display_name || 'Asmare Belay')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const socials = useSocials(profile)

const externalProfiles = computed(() => {
  const meta = profile.value?.meta || {}
  const rows = [
    { label: 'ORCID', href: meta.orcid },
    { label: 'Google Scholar', href: meta.google_scholar },
    { label: 'ResearchGate', href: meta.researchgate },
  ].filter((row) => row.href)
  if (profile.value?.website && !rows.some((r) => r.href === profile.value.website)) {
    rows.push({ label: 'Personal Website', href: profile.value.website })
  }
  return rows
})

const quickInfo = computed(() => {
  const meta = profile.value?.meta || {}
  return [
    { label: 'Location', value: profile.value?.location || 'Kombolcha, Ethiopia' },
    { label: 'Organization', value: meta.current_organization || '' },
    { label: 'Position', value: meta.current_position || '' },
    { label: 'Email', value: profile.value?.email_public || '' },
    { label: 'Phone', value: profile.value?.phone || '' },
  ].filter((row) => row.value)
})

const ICONS = {
  pin: 'M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v.4l8 5 8-5V6l-8 5-8-5z',
  phone:
    'M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.3 1z',
  briefcase: 'M10 2h4a2 2 0 0 1 2 2v2h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2zm0 4h4V4h-4v2z',
  tag: 'M21.4 11.6 12.4 2.6A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7c0 .5.2 1 .6 1.4l9 9a2 2 0 0 0 2.8 0l7-7a2 2 0 0 0 0-2.8zM6.5 8A1.5 1.5 0 1 1 8 6.5 1.5 1.5 0 0 1 6.5 8z',
}

function rowIcon(label) {
  if (label === 'Location') return 'pin'
  if (label === 'Email') return 'mail'
  if (label === 'Phone') return 'phone'
  if (label === 'Organization') return 'briefcase'
  return 'tag'
}

async function load() {
  loading.value = true
  try {
    const [profileRes, langRes] = await Promise.all([
      http.get('/profile'),
      http.get('/languages').catch(() => ({ data: [] })),
    ])
    profile.value = profileRes.data
    languages.value = langRes.data ?? []
  } catch {
    /* page still renders with fallbacks */
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-12">
    <header
      class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-brand-950 px-6 py-10 shadow-xl shadow-navy-950/30 sm:px-10"
    >
      <div class="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl" />
      <div class="relative">
        <p class="eyebrow !text-accent-400">About</p>
        <h1 class="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {{ profile?.display_name || 'Asmare Belay Ngussie' }}
        </h1>
        <p class="mt-2 text-sm text-slate-300">
          {{ profile?.headline || 'Hydrology & Water Resources Engineer | Lecturer & Researcher' }}
        </p>
      </div>
    </header>

    <div class="grid gap-10 lg:grid-cols-12">
      <!-- Biography -->
      <div class="lg:col-span-8">
        <h2 class="font-display text-xl font-bold text-navy-900 dark:text-white">Professional Biography</h2>
        <div
          v-if="loading"
          class="mt-4 space-y-3"
        >
          <div class="skeleton h-4 w-full" />
          <div class="skeleton h-4 w-5/6" />
          <div class="skeleton h-4 w-4/6" />
        </div>
        <div v-else class="mt-4 space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <p v-for="(paragraph, i) in paragraphs" :key="i">{{ paragraph }}</p>
          <p v-if="!paragraphs.length" class="text-slate-400">Biography coming soon.</p>
        </div>

        <!-- Languages -->
        <section v-if="languages.length" class="mt-10">
          <h2 class="font-display text-xl font-bold text-navy-900 dark:text-white">Languages</h2>
          <ul class="mt-4 grid gap-3 sm:grid-cols-2">
            <li
              v-for="lang in languages"
              :key="lang.id"
              class="card flex items-center justify-between p-4"
            >
              <span class="font-display text-sm font-bold text-navy-900 dark:text-white">{{ lang.name }}</span>
              <span class="chip !border-brand-100 !bg-brand-50/80 !text-brand-700 dark:!border-brand-500/30 dark:!bg-brand-600/15 dark:!text-brand-300">
                {{ lang.proficiency }}
              </span>
            </li>
          </ul>
        </section>
      </div>

      <!-- Quick info panel -->
      <aside class="lg:col-span-4">
        <div class="panel-navy flex flex-col gap-1 p-6">
          <p class="mb-2 font-display text-sm font-bold uppercase tracking-wider text-white">Quick Info</p>
          <div
            v-for="row in quickInfo"
            :key="row.label"
            class="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-white/5"
          >
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-300">
              <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current" aria-hidden="true">
                <path :d="ICONS[rowIcon(row.label)] || ICONS.tag" />
              </svg>
            </span>
            <span class="min-w-0">
              <span class="block text-xs text-slate-400">{{ row.label }}</span>
              <span class="block truncate text-sm font-semibold text-white">{{ row.value }}</span>
            </span>
          </div>

          <!-- Academic profiles -->
          <div v-if="externalProfiles.length" class="mt-3 border-t border-white/10 px-3 pt-4">
            <p class="text-xs text-slate-400">Academic profiles</p>
            <ul class="mt-2 space-y-1.5">
              <li v-for="row in externalProfiles" :key="row.label">
                <a
                  :href="row.href"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 transition hover:gap-2.5"
                >
                  <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-none stroke-current stroke-2" stroke-linecap="round" aria-hidden="true">
                    <path d="M7 17 17 7M7 7h10v10" />
                  </svg>
                  {{ row.label }}
                </a>
              </li>
            </ul>
          </div>

          <!-- Social icons -->
          <div class="mt-4 flex gap-2 border-t border-white/10 px-3 pt-4">
            <a
              v-for="social in socials"
              :key="social.key"
              :href="social.href"
              :aria-label="social.label"
              target="_blank"
              rel="noopener"
              class="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-slate-400 transition hover:border-brand-500 hover:bg-brand-600 hover:text-white"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 fill-current" aria-hidden="true">
                <path :d="social.path || SOCIAL_PATHS.email" />
              </svg>
            </a>
          </div>
        </div>
      </aside>
    </div>

    <!-- CTAs -->
    <div class="flex flex-wrap gap-4">
      <RouterLink to="/experience" class="btn-primary">View Experience →</RouterLink>
      <RouterLink to="/cv" class="btn-outline">Download CV</RouterLink>
      <RouterLink to="/contact" class="btn-outline">Contact Me</RouterLink>
    </div>
  </div>
</template>
