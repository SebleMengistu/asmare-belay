<script setup>
import { onMounted, ref } from 'vue'
import http from '../../api/http'

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const savedNotice = ref('')
const fieldErrors = ref({})
const rows = ref([])
const files = ref([])

const emptyForm = {
  id: null,
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  status: 'draft',
  published_at: '',
  meta_title: '',
  meta_description: '',
  tags_text: '',
}

const showForm = ref(false)
const form = ref({ ...emptyForm })

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/admin/posts')
    rows.value = res.data ?? []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function openCreate() {
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
    // Re-fetch so tags arrive as a proper array for the edit payload.
    const res = await http.get(`/admin/posts/${row.id}`)
    const p = res.data
    form.value = {
      id: p.id,
      title: p.title ?? '',
      slug: p.slug ?? '',
      excerpt: p.excerpt ?? '',
      body: p.body ?? '',
      status: p.status ?? 'draft',
      published_at: p.published_at ?? '',
      meta_title: p.meta_title ?? '',
      meta_description: p.meta_description ?? '',
      tags_text: Array.isArray(p.tags)
        ? p.tags.map((t) => (typeof t === 'object' ? (t.name ?? t.slug ?? '') : t)).join('\n')
        : String(p.tags ?? ''),
    }
    files.value = []
    showForm.value = true
  } catch (e) {
    error.value = e.message
  }
}

function splitTags(text) {
  return String(text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function buildPayload() {
  const data = {
    title: form.value.title.trim(),
    slug: form.value.slug.trim() || null,
    excerpt: form.value.excerpt.trim() || null,
    body: form.value.body.trim(),
    status: form.value.status || 'draft',
    published_at: form.value.published_at || null,
    meta_title: form.value.meta_title.trim() || null,
    meta_description: form.value.meta_description.trim() || null,
    tags: splitTags(form.value.tags_text),
  }
  return data
}

async function submit() {
  saving.value = true
  error.value = ''
  fieldErrors.value = {}
  savedNotice.value = ''
  try {
    const payload = buildPayload()
    const isMultipart = files.value.length > 0

    // Cover uploads must go out as FormData (Spatie media via addMediaFromRequest).
    // PHP cannot parse file uploads on real PUT bodies, so multipart updates
    // POST with an internal _method=PUT spoof (mirrors the projects view).
    let res
    if (form.value.id === null) {
      res = isMultipart ? await http.post('/admin/posts', toFormData(payload, false)) : await http.post('/admin/posts', payload)
    } else if (isMultipart) {
      res = await http.post(`/admin/posts/${form.value.id}`, toFormData(payload, true))
    } else {
      res = await http.put(`/admin/posts/${form.value.id}`, payload)
    }

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

function toFormData(data, forUpdate) {
  // CRUD store/update send JSON. With a cover file the payload becomes
  // multipart so Spatie can persist it to the 'cover' media collection.
  const fd = new FormData()
  if (forUpdate) fd.append('_method', 'PUT')
  Object.entries(data).forEach(([key, value]) => {
    if (value === null) return
    if (Array.isArray(value)) value.forEach((v) => fd.append(`${key}[]`, v))
    else fd.append(key, value)
  })
  files.value.forEach((file) => fd.append('cover', file))
  return fd
}

async function remove(row) {
  if (!window.confirm(`Delete “${row.title}”? This cannot be undone.`)) return
  error.value = ''
  try {
    await http.delete(`/admin/posts/${row.id}`)
    await load()
  } catch (e) {
    error.value = e.message
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Blog posts</h1>
        <p class="text-sm text-slate-500">{{ rows.length }} total.</p>
      </div>
      <button type="button" class="btn-primary" @click="openCreate">+ New post</button>
    </header>

    <p v-if="loading" class="text-sm text-slate-500">Loading posts…</p>

    <div v-else-if="rows.length" class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-4 py-2.5">Title</th>
            <th class="px-4 py-2.5">Status</th>
            <th class="px-4 py-2.5">Published</th>
            <th class="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="row in rows" :key="row.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 font-medium text-slate-900">{{ row.title }}</td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="row.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ row.status === 'published' ? 'Published' : 'Draft' }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ row.published_at ? String(row.published_at).slice(0, 10) : '—' }}</td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <button type="button" class="font-semibold text-brand-600 hover:text-brand-800" @click="openEdit(row)">Edit</button>
              <span class="px-1 text-slate-300">|</span>
              <button type="button" class="font-medium text-red-600 hover:text-red-800" @click="remove(row)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
      No posts yet — write your first one.
    </p>

    <Teleport to="body">
      <div v-if="showForm" class="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4" @click.self="showForm = false">
        <form novalidate class="mx-auto w-full max-w-xl space-y-4 rounded-xl bg-white p-6 shadow-lg" @submit.prevent="submit">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-slate-900">{{ form.id ? 'Edit post' : 'New post' }}</h2>
            <button type="button" class="text-xl leading-none text-slate-400 hover:text-slate-700" @click="showForm = false">×</button>
          </div>

          <div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error }}</div>

          <label class="block space-y-1">
            <span class="text-sm font-medium text-slate-700">Title *</span>
            <input v-model="form.title" type="text" required class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <span v-if="fieldErrors.title" class="block text-xs text-red-600">{{ fieldErrors.title[0] }}</span>
          </label>

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Slug (auto if empty)</span>
              <input v-model="form.slug" type="text" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <span v-if="fieldErrors.slug" class="block text-xs text-red-600">{{ fieldErrors.slug[0] }}</span>
            </label>

            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Status</span>
              <select v-model="form.status" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>

          <label class="block space-y-1">
            <span class="text-sm font-medium text-slate-700">Excerpt</span>
            <textarea v-model="form.excerpt" rows="2" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"></textarea>
          </label>

          <label class="block space-y-1">
            <span class="text-sm font-medium text-slate-700">Body *</span>
            <textarea v-model="form.body" rows="10" required class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"></textarea>
            <span v-if="fieldErrors.body" class="block text-xs text-red-600">{{ fieldErrors.body[0] }}</span>
          </label>

          <label class="block space-y-1">
            <span class="text-sm font-medium text-slate-700">Published at</span>
            <input v-model="form.published_at" type="date" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <span v-if="fieldErrors.published_at" class="block text-xs text-red-600">{{ fieldErrors.published_at[0] }}</span>
          </label>

          <label class="block space-y-1">
            <span class="text-sm font-medium text-slate-700">Cover image (optional, up to 10 MB)</span>
            <input
              type="file"
              accept="image/*"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              @change="files = $event.target.files ? Array.from($event.target.files) : []"
            />
          </label>

          <label class="block space-y-1">
            <span class="text-sm font-medium text-slate-700">Tags (one per line)</span>
            <textarea v-model="form.tags_text" rows="3" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"></textarea>
          </label>

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Meta title</span>
              <input v-model="form.meta_title" type="text" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Meta description</span>
              <textarea v-model="form.meta_description" rows="2" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"></textarea>
            </label>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100" @click="showForm = false">
              Cancel
            </button>
            <button type="submit" :disabled="saving" class="btn-primary disabled:opacity-50">
              {{ saving ? 'Saving…' : 'Save post' }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>
