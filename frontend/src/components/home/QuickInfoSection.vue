<script setup>
import { computed } from 'vue'
import { SOCIAL_PATHS } from '../../composables/useSocials'

const props = defineProps({
  profile: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})

const meta = computed(() => props.profile?.meta || {})

const infoRows = computed(() =>
  [
    { label: 'Location', value: props.profile?.location || 'Kombolcha, Ethiopia', icon: 'pin' },
    { label: 'Organization', value: meta.value.current_organization || 'Wollo University / KIoT', icon: 'briefcase' },
    { label: 'Position', value: meta.value.current_position || 'Lecturer and Researcher', icon: 'tag' },
    { label: 'Email', value: props.profile?.email_public || 'asmarebelay@kiot.edu.et', icon: 'mail' },
    { label: 'Phone', value: props.profile?.phone || '+251-918-600147', icon: 'phone' },
  ].filter((row) => row.value),
)

const academicProfiles = computed(() => {
  const rows = [
    { label: 'ORCID', href: meta.value.orcid },
    { label: 'Google Scholar', href: meta.value.google_scholar },
    { label: 'ResearchGate', href: meta.value.researchgate },
  ].filter((row) => row.href)
  if (props.profile?.website && !rows.some((r) => r.href === props.profile.website)) {
    rows.push({ label: 'Personal Website', href: props.profile.website })
  }
  return rows
})

const ICONS = {
  pin: 'M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v.4l8 5 8-5V6l-8 5-8-5z',
  phone:
    'M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.3 1z',
  briefcase: 'M10 2h4a2 2 0 0 1 2 2v2h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2zm0 4h4V4h-4v2z',
  tag: 'M21.4 11.6 12.4 2.6A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7c0 .5.2 1 .6 1.4l9 9a2 2 0 0 0 2.8 0l7-7a2 2 0 0 0 0-2.8zM6.5 8A1.5 1.5 0 1 1 8 6.5 1.5 1.5 0 0 1 6.5 8z',
}
</script>

<template>
  <section class="py-14">
    <div class="container-site">
      <div class="grid gap-6 lg:grid-cols-12">
        <!-- Quick info card -->
        <div class="card p-6 lg:col-span-7">
          <h2 class="font-display text-lg font-bold text-navy-900 dark:text-white">Quick Professional Info</h2>
          <div v-if="loading" class="mt-5 grid gap-4 sm:grid-cols-2">
            <div v-for="n in 4" :key="n" class="skeleton h-12 w-full" />
          </div>
          <ul v-else class="mt-5 grid gap-4 sm:grid-cols-2">
            <li
              v-for="row in infoRows"
              :key="row.label"
              class="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3 dark:border-white/5 dark:bg-white/5"
            >
              <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-400">
                <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current" aria-hidden="true">
                  <path :d="ICONS[row.icon] || ICONS.tag" />
                </svg>
              </span>
              <span class="min-w-0">
                <span class="block text-xs text-slate-400">{{ row.label }}</span>
                <span class="block truncate text-sm font-semibold text-navy-900 dark:text-white">{{ row.value }}</span>
              </span>
            </li>
          </ul>
        </div>

        <!-- Academic profiles card -->
        <div class="panel-navy p-6 lg:col-span-5">
          <h2 class="font-display text-lg font-bold text-white">Profiles &amp; Research Links</h2>
          <p class="mt-1 text-sm text-slate-400">Find my work and citation record on academic platforms.</p>

          <div v-if="loading" class="mt-5 space-y-3">
            <div v-for="n in 3" :key="n" class="skeleton h-10 w-full" />
          </div>

          <ul v-else-if="academicProfiles.length" class="mt-5 space-y-2.5">
            <li v-for="row in academicProfiles" :key="row.label">
              <a
                :href="row.href"
                target="_blank"
                rel="noopener"
                class="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-brand-500 hover:bg-brand-600"
              >
                {{ row.label }}
                <svg
                  viewBox="0 0 24 24"
                  class="h-4 w-4 fill-none stroke-current stroke-2 text-slate-400 transition group-hover:text-white"
                  stroke-linecap="round"
                  aria-hidden="true"
                >
                  <path d="M7 17 17 7M7 7h10v10" />
                </svg>
              </a>
            </li>
          </ul>

          <p v-else class="mt-5 text-sm text-slate-400">Academic profiles coming soon.</p>

          <a
            v-if="infoRows.find((r) => r.label === 'Email')"
            :href="`mailto:${infoRows.find((r) => r.label === 'Email').value}`"
            class="btn-primary mt-5 w-full"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4 fill-current" aria-hidden="true">
              <path :d="SOCIAL_PATHS.email" />
            </svg>
            Email Me
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
