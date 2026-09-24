<script setup>
import { computed, onMounted, ref } from 'vue'
import http from '../../api/http'

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const cv = ref({ available: false, url: null, updated_at: null, file_name: null })
const profile = ref(null)
const file = ref(null)
const cvUrlInput = ref('')
const downloads = ref(null)

const currentUrl = computed(() => cv.value?.url || profile.value?.resume || '')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [cvRes, profileRes, analyticsRes] = await Promise.all([
      http.get('/cv').catch(() => ({ data: { available: false } })),
      http.get('/admin/profile').catch(() => ({ data: [] })),
      http.get('/admin/analytics/overview').catch(() => ({ data: null })),
    ])
    cv.value = cvRes.data
    profile.value = Array.isArray(profileRes.data) ? profileRes.data[0] : profileRes.data
    downloads.value = analyticsRes.data?.outbound?.cv_download ?? null
    cvUrlInput.value = cv.value?.url && !cv.value.available === false ? '' : ''
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function onFileChange(event) {
  file.value = event.target.files?.[0] || null
}

async function uploadFile() {
  if (!file.value) return
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    // The profile resume collection is the source of truth for the public /cv page.
    const target = profile.value?.id
    if (!target) throw new Error('No profile found — create one first.')
    const fd = new FormData()
    fd.append('_method', 'PUT')
    fd.append('first_name', profile.value.first_name ?? '')
    fd.append('last_name', profile.value.last_name ?? '')
    fd.append('display_name', profile.value.display_name ?? '')
    fd.append('resume', file.value)
    await http.post(`/admin/profiles/${target}`, fd)
    notice.value = 'CV uploaded. The public CV page now serves this file.'
    file.value = null
    await load()
  } catch (e) {
    error.value = e.message
    if (e.status === 422 && e.errors) {
      error.value = Object.values(e.errors).flat().join(' ')
    }
  } finally {
    saving.value = false
  }
}

async function saveExternalUrl() {
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    const target = profile.value?.id
    if (!target) throw new Error('No profile found — create one first.')
    const meta = { ...(profile.value?.meta || {}), cv_url: cvUrlInput.value.trim() || null }
    await http.put(`/admin/profiles/${target}`, { meta })
    notice.value = cvUrlInput.value.trim()
      ? 'External CV URL saved.'
      : 'External CV URL cleared.'
    await load()
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">CV Management</h1>
      <p class="text-sm text-slate-500">Upload the current CV or point to an external copy. Downloads are tracked automatically.</p>
    </header>

    <div v-if="notice" class="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">{{ notice }}</div>
    <div v-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>
    <p v-if="loading" class="text-sm text-slate-500">Loading…</p>

    <template v-else>
      <!-- Current CV -->
      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Current CV</h2>
        <div v-if="currentUrl" class="mt-3 flex flex-wrap items-center gap-4">
          <span class="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600" aria-hidden="true">
            <svg viewBox="0 0 24 24" class="h-6 w-6 fill-current">
              <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1.5V8h4.5L14 3.5z" />
            </svg>
          </span>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-900">{{ cv?.file_name || 'CV file' }}</p>
            <p v-if="cv?.updated_at" class="text-xs text-slate-400">
              Updated {{ new Date(cv.updated_at).toLocaleString() }}
            </p>
          </div>
          <a :href="currentUrl" target="_blank" rel="noopener" class="ml-auto text-sm font-semibold text-brand-600 hover:text-brand-800">
            Open ↗
          </a>
        </div>
        <p v-else class="mt-3 text-sm text-slate-500">No CV uploaded yet.</p>

        <p v-if="downloads !== null" class="mt-4 rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-600">
          Total downloads tracked: <strong>{{ downloads }}</strong>
        </p>
      </div>

      <!-- Upload new -->
      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Upload / replace CV</h2>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            class="text-sm"
            @change="onFileChange"
          />
          <button type="button" class="btn-primary" :disabled="!file || saving" @click="uploadFile">
            {{ saving ? 'Uploading…' : 'Upload CV' }}
          </button>
        </div>
        <p class="mt-2 text-xs text-slate-400">PDF or Word document, up to 5 MB. Uploading replaces the current file.</p>
      </div>

      <!-- External URL -->
      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Or use an external URL</h2>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <input
            v-model="cvUrlInput"
            type="url"
            placeholder="https://drive.google.com/…"
            class="min-w-[260px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="button" class="btn-outline" :disabled="saving" @click="saveExternalUrl">
            Save URL
          </button>
        </div>
        <p class="mt-2 text-xs text-slate-400">Used only when no file is uploaded.</p>
      </div>
    </template>
  </div>
</template>
