<script setup>
import { onMounted, ref } from 'vue'
import http from '../../api/http'
import BasePagination from '../../components/BasePagination.vue'
import { fmtSize } from '../../utils/format'

const loading = ref(true)
const uploading = ref(false)
const error = ref('')
const notice = ref('')
const items = ref([])
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const page = ref(1)
const search = ref('')
const fileInput = ref(null)

const isImage = (item) => (item.mime_type ?? '').startsWith('image/')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/admin/media', {
      params: { page: page.value, search: search.value || undefined },
    })
    items.value = res.data ?? []
    pagination.value =
      res.meta?.pagination ?? { current_page: 1, last_page: 1, total: items.value.length }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function upload() {
  const files = fileInput.value?.files
  if (!files?.length) return
  uploading.value = true
  error.value = ''
  notice.value = ''
  try {
    const fd = new FormData()
    fd.append('media', files[0])
    const res = await http.post('/admin/media', fd)
    notice.value = res.message || 'Uploaded.'
    fileInput.value.value = ''
    page.value = 1
    await load()
  } catch (e) {
    error.value = e.message
  } finally {
    uploading.value = false
  }
}

function onSearch() {
  page.value = 1
  load()
}

async function remove(item) {
  if (!window.confirm(`Delete “${item.file_name}”?`)) return
  try {
    await http.delete(`/admin/media/${item.id}`)
    notice.value = 'Deleted.'
    await load()
  } catch (e) {
    error.value = e.message
  }
}

function goTo(n) {
  if (n < 1 || n > pagination.value.last_page) return
  page.value = n
  load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Media library</h1>
      </div>

      <div class="flex items-center gap-3">
        <input
          v-model.trim="search"
          type="search"
          placeholder="Search files…"
          class="w-48 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-400"
          @keyup.enter="onSearch"
        />
        <label class="btn-primary cursor-pointer">
          {{ uploading ? 'Uploading…' : '+ Upload' }}
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            :disabled="uploading"
            @change="upload"
          />
        </label>
      </div>
    </header>

    <div v-if="notice" class="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">{{ notice }}</div>
    <div v-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <p v-if="loading" class="text-sm text-slate-500">Loading media…</p>
    <p v-else-if="!items.length" class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
      No media yet — upload an image or document.
    </p>

    <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <article
        v-for="item in items"
        :key="item.id"
        class="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div class="relative aspect-video bg-slate-100">
          <img
            v-if="isImage(item)"
            :src="item.thumb"
            :alt="item.file_name"
            class="h-full w-full object-cover"
            loading="lazy"
          />
          <div v-else class="flex h-full w-full items-center justify-center text-3xl text-slate-300">📄</div>
          <button
            type="button"
            class="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-red-600 shadow transition hover:bg-red-600 hover:text-white"
            @click="remove(item)"
          >
            Delete
          </button>
        </div>
        <div class="space-y-0.5 p-3 text-xs">
          <p class="truncate font-medium text-slate-800" :title="item.file_name">{{ item.file_name }}</p>
          <p class="text-slate-400">{{ fmtSize(item.size) }} · {{ item.collection_name }}</p>
        </div>
      </article>
    </div>

    <BasePagination :current-page="pagination.current_page" :last-page="pagination.last_page" @change="goTo" />
  </div>
</template>
