<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  profile: { type: Object, default: null },
  educations: { type: Array, default: () => [] },
  certifications: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const FALLBACK_BIO =
  'I am a Hydrology and Water Resources Engineer and Researcher with over 6 years of academic and applied experience in hydrological modeling, integrated water management, and geospatial analysis.\n\nMy expertise spans SWAT/SWAT+, HEC-HMS, HEC-RAS, MODFLOW, HydroGeoSphere, GEE, GIS, Remote Sensing, R and Python — applied to climate impact assessment, flood forecasting, water storage evaluation, and watershed management.'

const paragraphs = computed(() =>
  String(props.profile?.bio || FALLBACK_BIO)
    .split(/\n{1,}/)
    .map((p) => p.trim())
    .filter(Boolean),
)

const TRAITS = ['Problem Solver', 'Lifelong Learner', 'Team Player', 'Quality Focused']

const contactRows = computed(() => [
  { icon: 'pin', label: 'Location', value: props.profile?.location || 'Kombolcha, Ethiopia' },
  { icon: 'mail', label: 'Email', value: props.profile?.email_public || 'asmarebelay@kiot.edu.et' },
  { icon: 'phone', label: 'Phone', value: props.profile?.phone || '+251-918-600147' },
  {
    icon: 'check',
    label: 'Availability',
    value: props.profile?.available_for_work === false ? 'Currently unavailable' : 'Open for opportunities',
  },
])

const photo = computed(() => props.profile?.cover || '')

const name = computed(() => props.profile?.display_name || 'Asmare Belay')

const sortedEducation = computed(() =>
  [...props.educations]
    .sort((a, b) => Number(b.end_date?.slice(0, 4) || 0) - Number(a.end_date?.slice(0, 4) || 0)),
)

const sortedCertifications = computed(() =>
  [...props.certifications].sort((a, b) =>
    String(b.issued_date || '').localeCompare(String(a.issued_date || '')),
  ),
)

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

function onKeydown(event) {
  if (event.key === 'Escape') closeLightbox()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

function formatDates(start, end) {
  const month = (date) =>
    new Date(date).toLocaleString('en-US', { month: 'short' })
  const startText = `${month(start)} ${start?.slice(0, 4)}`
  const endText = end ? `${month(end)} ${end?.slice(0, 4)}` : 'Present'
  return `${startText} — ${endText}`
}

const initials = computed(() =>
  String(name.value)
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const ICONS = {
  pin: 'M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v.4l8 5 8-5V6l-8 5-8-5z',
  phone:
    'M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.3 1z',
  check:
    'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1.2 14.5L6 11.7l1.6-1.6 3.2 3.2 5.6-5.6L18 9.3z',
}
</script>

<template>
  <section id="about" class="scroll-mt-16 py-20">
    <div class="container-site">
      <div class="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <!-- Photo -->
        <div class="lg:col-span-4">
          <div class="relative mx-auto max-w-sm lg:max-w-none">
            <div class="absolute -left-4 -top-4 h-full w-full rounded-3xl border-2 border-brand-100 dark:border-white/10" aria-hidden="true" />
            <div
              v-if="photo"
              class="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-lg shadow-navy-900/10"
            >
              <img
                :src="photo"
                :alt="`${name} at work`"
                class="h-full w-full origin-[58%_62%] scale-[1.18] object-cover"
              />
            </div>
            <div
              v-else
              class="relative grid aspect-[4/5] w-full place-items-center rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500 shadow-lg shadow-navy-900/10"
            >
              <span class="font-display text-6xl font-extrabold text-white">{{ initials }}</span>
            </div>
          </div>
        </div>

        <!-- Bio -->
        <div class="lg:col-span-5">
          <p class="eyebrow">About Me</p>
          <h2 class="section-title">Passionate about Water, Climate Resilience &amp; Research</h2>
          <div class="mt-4 space-y-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            <p v-for="(paragraph, i) in paragraphs" :key="i">{{ paragraph }}</p>
          </div>

          <ul class="mt-6 grid grid-cols-2 gap-3">
            <li
              v-for="trait in TRAITS"
              :key="trait"
              class="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5 text-sm font-semibold text-navy-900 dark:border-white/5 dark:bg-white/5 dark:text-slate-200"
            >
              <span class="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-brand-600 text-white">
                <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-current" aria-hidden="true">
                  <path d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 10-10L18.1 7.6z" />
                </svg>
              </span>
              {{ trait }}
            </li>
          </ul>
        </div>

        <!-- Contact card -->
        <div class="lg:col-span-3">
          <div class="panel-navy flex h-full flex-col gap-1 p-6">
            <div
              v-for="row in contactRows"
              :key="row.label"
              class="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-white/5"
            >
              <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-300">
                <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current" aria-hidden="true">
                  <path :d="ICONS[row.icon]" />
                </svg>
              </span>
              <span class="min-w-0">
                <span class="block text-xs text-slate-400">{{ row.label }}</span>
                <span class="block truncate text-sm font-semibold text-white">{{ row.value }}</span>
              </span>
            </div>

            <p class="mt-auto pt-4 text-center font-script text-4xl text-brand-400">{{ name }}</p>
          </div>
        </div>
      </div>

      <!-- Education -->
      <div class="mt-20">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="eyebrow">Education</p>
            <h3 class="section-title">Academic Journey</h3>
            <p class="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              The degrees and coursework that shaped my foundation in hydrology, hydraulics, and water resources engineering.
            </p>
          </div>
          <span class="hidden rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700 sm:inline-flex dark:border-brand-600/20 dark:bg-brand-600/10 dark:text-brand-300">
            {{ sortedEducation.length }} Degree{{ sortedEducation.length === 1 ? '' : 's' }} ·
            {{ sortedEducation[0]?.end_date?.slice(0, 4) }} — {{ sortedEducation[sortedEducation.length - 1]?.start_date?.slice(0, 4) }}
          </span>
        </div>

        <div v-if="loading" class="mt-8 grid gap-6 sm:grid-cols-2">
          <div v-for="n in 2" :key="n" class="skeleton h-44 w-full" />
        </div>

        <ol v-else-if="sortedEducation.length" class="mt-8 grid gap-6 sm:grid-cols-2">
          <li v-for="edu in sortedEducation" :key="edu.id" class="group relative flex">
            <div class="card card-hover flex h-full w-full flex-col overflow-hidden p-6">
              <div
                class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 to-accent-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden="true"
              />

              <div class="flex items-start justify-between gap-4">
                <span
                  class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500 text-white shadow-lg shadow-brand-600/25 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105"
                >
                  <svg viewBox="0 0 24 24" class="h-6 w-6 fill-current" aria-hidden="true">
                    <path d="M12 3 1 8l11 5 9-4.1V17h2V8zM5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.2z" />
                  </svg>
                </span>
                <p class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                  {{ formatDates(edu.start_date, edu.end_date) }}
                </p>
              </div>

              <h4 class="mt-5 font-display text-lg font-bold leading-snug text-navy-900 dark:text-white">
                {{ edu.degree }}
                <span v-if="edu.field_of_study" class="font-medium text-slate-500 dark:text-slate-400">
                  — {{ edu.field_of_study }}
                </span>
              </h4>

              <p class="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current stroke-2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span class="min-w-0">{{ edu.institution }}</span>
                <span v-if="edu.location" class="truncate text-slate-400">· {{ edu.location }}</span>
              </p>

              <div class="mt-auto pt-5">
                <p
                  class="inline-flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/80 px-3.5 py-2 text-xs font-bold text-brand-700 dark:border-brand-600/25 dark:bg-brand-600/15 dark:text-brand-300"
                >
                  <svg viewBox="0 0 24 24" class="h-4 w-4 fill-current" aria-hidden="true">
                    <path d="M12 2 14.6 8.6 21.6 9l-5.5 4.6 1.7 6.6-5.8-3.5-5.8 3.5 1.7-6.6L2.4 9l7-0.4z" />
                  </svg>
                  {{ edu.grade || 'Graduated' }}
                </p>
                <p v-if="edu.description" class="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {{ edu.description }}
                </p>
              </div>
            </div>
          </li>
        </ol>

        <p v-else class="mt-8 text-sm text-slate-400">No education entries yet.</p>
      </div>

      <!-- Certifications -->
      <div id="certification" class="mt-16 scroll-mt-16">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="eyebrow">Certifications</p>
            <h3 class="section-title">Credentials &amp; Recognitions</h3>
            <p class="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Professional certifications, awards, and appointments earned throughout my academic and professional career.
            </p>
          </div>
          <div class="flex items-center gap-4">
            <span class="hidden rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700 sm:inline-flex dark:border-brand-600/20 dark:bg-brand-600/10 dark:text-brand-300">
              {{ sortedCertifications.length }} Credential{{ sortedCertifications.length === 1 ? '' : 's' }}
            </span>
            <RouterLink
              to="/certifications"
              class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:gap-2 dark:text-brand-400"
            >
              View All →
            </RouterLink>
          </div>
        </div>

        <div v-if="loading" class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="n in 6" :key="n" class="skeleton h-24 w-full" />
        </div>

        <ul v-else-if="sortedCertifications.length" class="mt-8 grid gap-4 sm:grid-cols-2">
          <li
            v-for="cert in sortedCertifications"
            :key="cert.id"
            class="group relative flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-navy-900/[0.06] dark:border-white/10 dark:bg-navy-850 dark:hover:border-brand-500/40"
          >
            <span
              class="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 text-brand-600 dark:bg-white/5 dark:text-brand-400"
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
            <div class="min-w-0">
              <p class="text-sm font-bold leading-snug text-navy-900 dark:text-white">{{ cert.name }}</p>
              <p class="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs font-medium text-slate-400">
                <span class="text-brand-600 dark:text-brand-400">{{ cert.issuer }}</span>
                <span v-if="cert.issued_date" aria-hidden="true">·</span>
                <span v-if="cert.issued_date">{{ cert.issued_date }}</span>
              </p>
            </div>
            <a
              v-if="cert.credential_url"
              :href="cert.credential_url"
              target="_blank"
              rel="noopener"
              class="ml-auto shrink-0 text-brand-600 opacity-0 transition hover:opacity-100 dark:text-brand-400 group-hover:opacity-100"
              aria-label="Verify credential"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current stroke-2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M7 17 17 7M7 7h10v10" />
              </svg>
            </a>
          </li>
        </ul>

        <p v-else class="mt-8 text-sm text-slate-400">No certifications added yet.</p>
      </div>
    </div>
  </section>

  <!-- Cert lightbox -->
  <div
    v-if="lightbox"
    class="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/90 p-4 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-label="Certification preview"
    @click="closeLightbox"
  >
    <button
      class="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      aria-label="Close preview"
      @click="closeLightbox"
    >
      <svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current stroke-2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
    <figure class="max-h-[90vh] max-w-3xl" @click.stop>
      <img :src="lightbox" :alt="lightboxName" class="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl" />
      <figcaption class="mt-3 text-center text-sm font-semibold text-slate-200">{{ lightboxName }}</figcaption>
    </figure>
  </div>
</template>
