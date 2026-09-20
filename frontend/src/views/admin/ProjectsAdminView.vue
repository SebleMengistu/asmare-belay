<script setup>
import { onMounted, ref } from 'vue'
import http from '../../api/http'

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const savedNotice = ref('')
const fieldErrors = ref({})
const rows = ref([])
const skills = ref([])
const files = ref([])

const emptyForm = {
  id: null,
  title: '',
  slug: '',
  summary: '',
  description: '',
  category: '',
  repo_url: '',
  demo_url: '',
  tech_stack_text: '',
  featured: false,
  is_active: true,
  start_date: '',
  end_date: '',
  skill_ids: [],
}

const showForm = ref(false)
const form = ref({ ...emptyForm })

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/admin/projects')
    rows.value = res.data ?? []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function loadSkills() {
  try {
    const res = await http.get('/skills')
    skills.value = res.data?.skills ?? []
  } catch {
    skills.value = [] // skills multiselect is optional sugar
  }
}

function splitTech(text) {
  return String(text || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function openCreate() {
  form.value = { ...emptyForm }
  files.value = []
  fieldErrors.value = {}
  error.value = ''
  showForm.value = true
}

async function openEdit(row) {
  fieldErrors.value = {}
  error.value = ''
  try {
    // The index payload omits relations; re-fetch for the synced skills.
    const res = await http.get(`/admin/projects/${row.id}`)
    const p = res.data
    form.value = {
      id: p.id,
      title: p.title ?? '',
      slug: p.slug ?? '',
      summary: p.summary ?? '',
      description: p.description ?? '',
      category: p.category ?? '',
      repo_url: p.repo_url ?? '',
      demo_url: p.demo_url ?? '',
      tech_stack_text: Array.isArray(p.tech_stack) ? p.tech_stack.join(', ') : String(p.tech_stack ?? ''),
      featured: Boolean(p.featured),
      is_active: Boolean(p.is_active),
      start_date: p.start_date ?? '',
      end_date: p.end_date ?? '',
      skill_ids: (p.skills ?? []).map((s) => s.id),
    }
    files.value = []
    showForm.value = true
  } catch (e) {
    error.value = e.message
  }
}

function buildPayload() {
  const data = {
    title: form.value.title.trim(),
    slug: form.value.slug.trim() || null,
    summary: form.value.summary.trim() || null,
    description: form.value.description.trim() || null,
    category: form.value.category.trim() || null,
    repo_url: form.value.repo_url.trim() || null,
    demo_url: form.value.demo_url.trim() || null,
    tech_stack: splitTech(form.value.tech_stack_text),
    featured: form.value.featured,
    is_active: form.value.is_active,
    start_date: form.value.start_date || null,
    end_date: form.value.end_date || null,
    skill_ids: form.value.skill_ids.map(Number),
  }

  if (!files.value.length) return data

  // Multipart variant (file uploads need FormData). For updates we spoof PUT
  // via _method because PHP does not parse multipart bodies on real PUTs.
  const fd = new FormData()
  if (form.value.id) fd.append('_method', 'PUT')
  Object.entries(data).forEach(([key, value]) => {
    if (value === null) return
    if (Array.isArray(value)) value.forEach((v) => fd.append(`${key}[]`, v))
    else fd.append(key, value)
  })
  files.value.forEach((file) => fd.append('media[]', file))
  return fd
}

async function submit() {
  saving.value = true
  error.value = ''
  fieldErrors.value = {}
  savedNotice.value = ''
  try {
    const payload = buildPayload()
    const isMultipart = payload instanceof FormData

    // Create always POSTs. Multipart updates POST with an internal _method=PUT
    // (PHP cannot parse file uploads on real PUT bodies); JSON updates use PUT.
    const res =
      form.value.id === null
        ? await http.post('/admin/projects', payload)
        : isMultipart
          ? await http.post(`/admin/projects/${form.value.id}`, payload)
          : await http.put(`/admin/projects/${form.value.id}`, payload)

    savedNotice.value = res.message || 'Saved.'
    showForm.value = false
    await load()
  } catch (e) {
    error.value = e.message
    if (e.status === 422 && e.errors) fieldErrors.value = e.errors
  } finally {
    saving.value = false
  }
}

async function remove(row) {
  if (!window.confirm(`Delete “${row.title}”? This cannot be undone.`)) return
  error.value = ''
  try {
    await http.delete(`/admin/projects/${row.id}`)
    await load()
  } catch (e) {
    error.value = e.message
  }
}

onMounted(() => {
  load()
  loadSkills()
})
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
  <div>
    <h1 class="text-2xl font-bold tracking-tight text-slate-900">Projects</h1>
    <p class="text-sm text-slate-500">{{ rows.length }} total.</p>
  </div>
  <button
    type="button"
    class="btn-primary"
    @click="openCreate"
  >
    + New project
  </button>
</header>

<div v-if="savedNotice" class="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">{{ savedNotice }}</div>
<div v-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>
    <p v-if="loading" class="text-sm text-slate-500">Loading projects…</p>

<div v-else-if="rows.length" class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
  <table class="w-full text-left text-sm">
    <thead class="bg-slate-50 text-xs uppercase text-slate-500">
      <tr>
        <th class="px-4 py-2.5">Title</th>
        <th class="px-4 py-2.5">Category</th>
        <th class="px-4 py-2.5">Status</th>
        <th class="px-4 py-2.5 text-right">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100">
      <tr v-for="row in rows" :key="row.id" class="hover:bg-slate-50">
        <td class="px-4 py-3 font-medium text-slate-900">{{ row.title }}</td>
        <td class="px-4 py-3 text-slate-600">{{ row.category || '—' }}</td>
        <td class="space-x-1 px-4 py-3 whitespace-nowrap">
          <span
            class="rounded-full px-2 py-0.5 text-xs font-medium"
            :class="row.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'"
          >
            {{ row.is_active ? 'Active' : 'Hidden' }}
          </span>
          <span v-if="row.featured" class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">★</span>
        </td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          <button type="button" class="font-semibold text-brand-600 hover:text-brand-800" @click="openEdit(row)">Edit</button>
          <span class="px-1 text-slate-300">|</span>
          <button
            type="button"
            class="font-medium text-red-600 hover:text-red-800 disabled:cursor-wait disabled:opacity-50"
            :disabled="removingId === row.id"
            @click="remove(row)"
          >
            {{ removingId === row.id ? 'Deleting…' : 'Delete' }}
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<p v-else class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
  No projects yet — create your first one.
</p>
    <Teleport to="body">
  <div v-if="showForm" class="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4" @click.self="showForm = false">
    <form novalidate class="mx-auto w-full max-w-xl space-y-4 rounded-xl bg-white p-6 shadow-lg" @submit.prevent.stop="submit">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-slate-900">{{ form.id ? 'Edit project' : 'New project' }}</h2>
        <button type="button" class="text-xl leading-none text-slate-400 hover:text-slate-700" @click="showForm = false">×</button>
      </div>

      <div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</div>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block space-y-1 sm:col-span-2">
          <span class="text-sm font-medium text-slate-700">Title *</span>
          <input v-model="form.title" type="text" required class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <span v-if="fieldErrors.title" class="block text-xs text-red-600">{{ fieldErrors.title[0] }}</span>
        </label>

        <label class="block space-y-1">
          <span class="text-sm font-medium text-slate-700">Slug (auto if empty)</span>
          <input v-model="form.slug" type="text" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <span v-if="fieldErrors.slug" class="block text-xs text-red-600">{{ fieldErrors.slug[0] }}</span>
        </label>

        <label class="block space-y-1">
          <span class="text-sm font-medium text-slate-700">Category</span>
          <input v-model="form.category" type="text" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>

        <label class="block space-y-1">
          <span class="text-sm font-medium text-slate-700">Repo URL</span>
          <input v-model="form.repo_url" type="url" placeholder="https://github.com/…" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <span v-if="fieldErrors.repo_url" class="block text-xs text-red-600">{{ fieldErrors.repo_url[0] }}</span>
        </label>

        <label class="block space-y-1">
          <span class="text-sm font-medium text-slate-700">Demo URL</span>
          <input v-model="form.demo_url" type="url" placeholder="https://…" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <span v-if="fieldErrors.demo_url" class="block text-xs text-red-600">{{ fieldErrors.demo_url[0] }}</span>
        </label>
      </div>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-slate-700">Summary</span>
        <textarea v-model="form.summary" rows="2" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"></textarea>
      </label>

            <label class="block space-y-1">
        <span class="text-sm font-medium text-slate-700">Description</span>
        <textarea v-model="form.description" rows="5" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"></textarea>
      </label>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-slate-700">Tech stack (comma separated)</span>
        <input v-model="form.tech_stack_text" type="text" placeholder="Laravel, Vue, PostgreSQL" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </label>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block space-y-1">
          <span class="text-sm font-medium text-slate-700">Start date</span>
          <input v-model="form.start_date" type="date" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label class="block space-y-1">
          <span class="text-sm font-medium text-slate-700">End date</span>
          <input v-model="form.end_date" type="date" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <span v-if="fieldErrors.end_date" class="block text-xs text-red-600">{{ fieldErrors.end_date[0] }}</span>
        </label>
      </div>

      <div class="flex gap-6">
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <input v-model="form.featured" type="checkbox" class="rounded border-slate-300" /> Featured
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <input v-model="form.is_active" type="checkbox" class="rounded border-slate-300" /> Active
        </label>
      </div>

      <fieldset v-if="skills.length" class="space-y-1.5 rounded-md border border-slate-200 p-3">
        <legend class="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Skills used</legend>
        <div class="flex max-h-32 flex-wrap gap-x-4 gap-y-1.5 overflow-y-auto">
          <label v-for="skill in skills" :key="skill.id" class="flex items-center gap-1.5 text-sm text-slate-700">
            <input v-model="form.skill_ids" type="checkbox" :value="skill.id" class="rounded border-slate-300" />
            {{ skill.name }}
          </label>
        </div>
      </fieldset>

      <label class="block space-y-1">
        <span class="text-sm font-medium text-slate-700">Screenshots (optional, up to 10 MB each)</span>
        <input
          type="file"
          accept="image/*"
          multiple
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          @change="files = $event.target.files ? Array.from($event.target.files) : []"
        />
      </label>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100" @click="showForm = false">
          Cancel
        </button>
        <button type="submit" :disabled="saving" class="btn-primary disabled:opacity-50">
          {{ saving ? 'Saving…' : 'Save project' }}
        </button>
      </div>
    </form>
  </div>
</Teleport>
  </div>
</template>
