<template>
  <section class="space-y-4">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-slate-900">{{ config.title }}</h1>
      <div class="flex items-center gap-2">
        <input
          v-model.trim="search"
          type="search"
          placeholder="Search..."
          class="w-52 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15"
          @input="load"
        />
        <button
          type="button"
          class="btn-primary"
          :disabled="busy"
          @click="openForm()"
        >
          New {{ config.singular }}
        </button>
      </div>
    </header>

    <div v-if="counts.length" class="flex flex-wrap items-center gap-2">
      <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {{ config.countsBy.label }}:
      </span>
      <span
        v-for="c in counts"
        :key="c.value"
        class="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
      >
        {{ c.label }}
        <span class="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-brand-700 ring-1 ring-brand-100">
          {{ c.count }}
        </span>
      </span>
    </div>

    <p v-if="error" class="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</p>

    <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table v-if="rows.length" class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50">
          <tr>
            <th
              v-for="col in config.columns"
              :key="col"
              class="px-4 py-2 text-left font-semibold uppercase tracking-wide text-slate-500"
            >
              {{ headLabel(col) }}
            </th>
            <th class="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="row in rows" :key="row.id" class="hover:bg-slate-50">
            <td v-for="col in config.columns" :key="col" class="max-w-[16rem] truncate px-4 py-2 text-slate-700">
              <template v-if="col === 'is_active' || col === 'current'">
                <span :class="(col === 'is_active' ? row.is_active : row.current)
                  ? 'font-semibold text-emerald-600'
                  : 'text-slate-400'">
                  {{ (col === 'is_active' ? row.is_active : row.current) ? 'Yes' : 'No' }}
                </span>
              </template>
              <template v-else>{{ cell(row, col) }}</template>
            </td>
            <td class="whitespace-nowrap px-4 py-2 text-right">
              <button type="button" class="mr-2 font-semibold text-brand-600 hover:text-brand-800" @click="openForm(row)">Edit</button>
              <button
                type="button"
                class="font-medium text-red-600 hover:underline disabled:opacity-40"
                :disabled="busy"
                @click="remove(row)"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else-if="!busy && !error" class="px-4 py-10 text-center text-sm text-slate-400">
        No {{ config.title.toLowerCase() }} yet.
      </p>
      <p v-else class="px-4 py-10 text-center text-sm text-slate-400">Loading...</p>
    </div>

    <!-- Modal form -->
    <Teleport to="body">
      <div v-if="editing" class="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/50 p-6" @click.self="editing = false">
        <form
          class="w-full max-w-xl space-y-4 rounded-lg bg-white p-6 shadow-xl"
          @submit.prevent="submit"
        >
          <h2 class="text-lg font-bold text-slate-900">
            {{ form.id ? `Edit ${config.singular}` : `New ${config.singular}` }}
          </h2>

          <p v-if="formError" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{{ formError }}</p>

          <div v-for="field in config.fields" :key="field.key" class="grid grid-cols-3 items-baseline gap-2">
            <label class="text-sm font-medium text-slate-600" :for="field.key">{{ field.label }}</label>

            <template v-if="field.type === 'textarea' || field.type === 'tags'">
              <textarea
                :id="field.key"
                v-model="form[field.key]"
                :rows="field.type === 'tags' ? 4 : 3"
                :placeholder="field.placeholder"
                class="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15"
              ></textarea>
            </template>

            <select
              v-else-if="field.type === 'select'"
              :id="field.key"
              v-model="form[field.key]"
              class="col-span-2 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15"
            >
              <option v-if="!field.required" value="">— None —</option>
              <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>

            <label v-else-if="field.type === 'boolean'" class="col-span-2 flex h-8 items-center text-sm">
              <input :id="field.key" v-model="form[field.key]" type="checkbox" class="size-4 accent-brand-600" />
              <span class="ml-2 text-slate-500">Enabled</span>
            </label>

            <template v-else-if="field.type === 'image'">
              <div class="col-span-2 flex items-center gap-3">
                <label
                  :for="`upload-${field.key}`"
                  class="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  {{ form[field.key] ? 'Choose another' : 'Choose image' }}
                  <input
                    :id="`upload-${field.key}`"
                    type="file"
                    :accept="field.accept"
                    class="hidden"
                    @change="onFileChange(field, $event)"
                  />
                </label>
                <a
                  v-if="form[field.key]"
                  :href="form[field.key]"
                  :target="form[field.key].startsWith('data:') ? undefined : '_blank'"
                  :rel="form[field.key].startsWith('data:') ? undefined : 'noopener'"
                >
                  <img :src="form[field.key]" alt="" class="h-10 w-10 rounded object-cover" />
                </a>
                <button
                  v-if="form[field.key]"
                  type="button"
                  class="text-xs font-medium text-red-600 hover:underline"
                  @click="form[field.key] = ''"
                >
                  Remove
                </button>
              </div>
            </template>

            <input
              v-else
              :id="field.key"
              v-model="form[field.key]"
              :type="field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'"
              :step="field.type === 'number' ? 'any' : undefined"
              :placeholder="field.placeholder"
              class="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15"
            />
          </div>

          <ul v-if="Object.keys(fieldErrors).length" class="list-inside list-disc text-xs text-red-600">
            <li v-for="(msgs, key) in fieldErrors" :key="key">{{ msgs[0] }}</li>
          </ul>

          <footer class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              @click="editing = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="saving"
            >
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </footer>
        </form>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { createResource, deleteResource, listResource, updateResource } from '../../api/resources'

const props = defineProps({ resourceKey: { type: String, required: true }, config: { type: Object, required: true } })

const rows = ref([])
const busy = ref(false)
const error = ref('')
const search = ref('')
const editing = ref(false)
const saving = ref(false)
const formError = ref('')
const fieldErrors = ref({})
const form = reactive({})

function blankRow() {
  const blank = {}
  for (const f of props.config.fields) {
    if (Object.prototype.hasOwnProperty.call(f, 'default')) blank[f.key] = f.default
    else if (f.type === 'boolean') blank[f.key] = false
    else blank[f.key] = ''
  }
  return blank
}

function onFileChange(field, event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    formError.value = `${file.name} is too large — max 2 MB.`
    event.target.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    form[field.key] = reader.result
    formError.value = ''
  }
  reader.onerror = () => {
    formError.value = 'Could not read the selected image.'
  }
  reader.readAsDataURL(file)
}

async function load() {
  busy.value = true
  error.value = ''
  try {
    rows.value = await listResource(props.resourceKey, search.value ? { search: search.value } : {})
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}

function openForm(row) {
  const source = row ?? blankRow()
  for (const f of props.config.fields) {
    let value = source[f.key]
    if (f.type === 'boolean') value = Boolean(value)
    else if (value == null) value = ''
    form[f.key] = value
  }
  form.id = row?.id
  formError.value = ''
  fieldErrors.value = {}
  editing.value = true
}

async function submit() {
  saving.value = true
  formError.value = ''
  fieldErrors.value = {}
  try {
    // Convert textarea "tags" input into arrays; empty strings -> null so
    // Laravel nullable/url/date rules behave as expected.
    const payload = {}
    for (const f of props.config.fields) {
      let v = form[f.key]
      if (f.type === 'tags') {
        v = typeof v === 'string'
          ? v.split('\n').map((s) => s.trim()).filter(Boolean)
          : Array.isArray(v) ? v.filter(Boolean) : []
        v = v.length ? v : null
      } else if (v === '') {
        v = null
      }
      payload[f.key] = v
    }

    if (form.id) await updateResource(props.resourceKey, form.id, payload)
    else await createResource(props.resourceKey, payload)

    editing.value = false
    await load()
  } catch (e) {
    formError.value = e.message
    fieldErrors.value = e.errors ?? {}
  } finally {
    saving.value = false
  }
}

async function remove(row) {
  if (!confirm(`Delete this ${props.config.singular.toLowerCase()}? This cannot be undone.`)) return
  busy.value = true
  error.value = ''
  try {
    await deleteResource(props.resourceKey, row.id)
    await load()
  } catch (e) {
    error.value = e.message
    busy.value = false
  }
}

const HEAD_LABELS = {
  is_active: 'Active',
  current: 'Current',
  start_date: 'Start',
  end_date: 'End',
  issued_date: 'Issued',
  expiry_date: 'Expires',
}

const counts = computed(() => {
  const field = props.config.countsBy?.field
  if (!field || !rows.value.length) return []
  const map = new Map()
  for (const row of rows.value) {
    const value = row[field] ?? ''
    map.set(value, (map.get(value) ?? 0) + 1)
  }
  return [...map.entries()].map(([value, count]) => ({
    value,
    label: props.config.formats?.[field]?.[value] ?? (value || '—'),
    count,
  }))
})

function headLabel(col) {
  return HEAD_LABELS[col] ?? col.replaceAll('_', ' ').replace(/^\w/, (c) => c.toUpperCase())
}

function cell(row, col) {
  let value = row[col]
  if (Array.isArray(value)) value = value.join(', ')
  if (col.endsWith('_date') && value) value = String(value).slice(0, 10)
  if (value == null || value === '') return '—'
  if (props.config.formats?.[col]?.[value]) return props.config.formats[col][value]
  return value
}

watch(
  () => props.resourceKey,
  () => {
    search.value = ''
    editing.value = false
    error.value = ''
    load()
  },
)

onMounted(load)
</script>
