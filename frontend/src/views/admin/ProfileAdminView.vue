<script setup>
import { onMounted, ref } from 'vue'
import http from '../../api/http'

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const savedNotice = ref('')
const fieldErrors = ref({})

const profile = ref(null)

const form = ref({
  first_name: '',
  last_name: '',
  display_name: '',
  headline: '',
  tagline: '',
  bio: '',
  location: '',
  website: '',
  email_public: '',
  phone: '',
  github: '',
  linkedin: '',
  twitter: '',
  whatsapp: '',
  roles_text: '',
  available_for_work: true,
  experience_years: 0,
  projects_completed: 0,
  research_publications: 0,
  technologies: 0,
  students_trained: 0,
})

const avatarFile = ref(null)
const coverFile = ref(null)
const resumeFile = ref(null)
const avatarPreview = ref('')
const coverPreview = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/admin/profile')
    const p = Array.isArray(res.data) ? res.data[0] : res.data
    profile.value = p
    form.value = {
      first_name: p.first_name ?? '',
      last_name: p.last_name ?? '',
      display_name: p.display_name ?? '',
      headline: p.headline ?? '',
      tagline: p.tagline ?? '',
      bio: p.bio ?? '',
      location: p.location ?? '',
      website: p.website ?? '',
      email_public: p.email_public ?? '',
      phone: p.phone ?? '',
      github: p.github ?? '',
      linkedin: p.linkedin ?? '',
      twitter: p.twitter ?? '',
      whatsapp: p.whatsapp ?? '',
      roles_text: Array.isArray(p.roles) ? p.roles.join(', ') : '',
      available_for_work: Boolean(p.available_for_work),
      experience_years: Number(p.meta?.experience_years ?? 0),
      projects_completed: Number(p.meta?.projects_completed ?? 0),
      research_publications: Number(p.meta?.research_publications ?? 0),
      technologies: Number(p.meta?.technologies ?? 0),
      students_trained: Number(p.meta?.students_trained ?? 0),
    }
    avatarPreview.value = p.avatar || ''
    coverPreview.value = p.cover || ''
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function onAvatarChange(e) {
  const file = e.target.files?.[0]
  if (file) {
    avatarFile.value = file
    avatarPreview.value = URL.createObjectURL(file)
  }
}

function onCoverChange(e) {
  const file = e.target.files?.[0]
  if (file) {
    coverFile.value = file
    coverPreview.value = URL.createObjectURL(file)
  }
}

function onResumeChange(e) {
  resumeFile.value = e.target.files?.[0] || null
}

async function submit() {
  if (!profile.value?.id) return
  saving.value = true
  error.value = ''
  fieldErrors.value = {}
  savedNotice.value = ''

  const fd = new FormData()
  fd.append('_method', 'PUT')

  const fields = [
    'first_name', 'last_name', 'display_name', 'headline', 'tagline',
    'bio', 'location', 'website', 'email_public', 'phone',
    'github', 'linkedin', 'twitter', 'whatsapp',
  ]
  fields.forEach((key) => fd.append(key, form.value[key] ?? ''))

  const roles = form.value.roles_text
    ? form.value.roles_text.split(',').map((r) => r.trim()).filter(Boolean)
    : []
  roles.forEach((r) => fd.append('roles[]', r))
  fd.append('available_for_work', form.value.available_for_work ? '1' : '0')

  // Homepage stat counters live in the profile meta JSON column.
  const statKeys = ['experience_years', 'projects_completed', 'research_publications', 'technologies', 'students_trained']
  statKeys.forEach((key) => fd.append(`meta[${key}]`, String(form.value[key] ?? 0)))

  if (avatarFile.value) fd.append('avatar', avatarFile.value)
  if (coverFile.value) fd.append('cover', coverFile.value)
  if (resumeFile.value) fd.append('resume', resumeFile.value)

  try {
    const res = await http.post(`/admin/profile/${profile.value.id}`, fd)
    savedNotice.value = res.message || 'Profile updated.'
    await load()
    avatarFile.value = null
    coverFile.value = null
    resumeFile.value = null
  } catch (e) {
    error.value = e.message
    if (e.status === 422 && e.errors) fieldErrors.value = e.errors
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Profile</h1>
      <p class="text-sm text-slate-500">Edit your public profile information, avatar, and cover image.</p>
    </header>

    <p v-if="loading" class="text-sm text-slate-500">Loading profile…</p>

    <div v-else class="space-y-6">
      <div v-if="savedNotice" class="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">{{ savedNotice }}</div>
      <div v-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

      <form novalidate class="space-y-6" @submit.prevent="submit">
        <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Images</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Avatar photo</span>
              <div v-if="avatarPreview" class="mb-2">
                <img :src="avatarPreview" alt="Avatar preview" class="h-20 w-20 rounded-full object-cover border border-slate-200" />
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" @change="onAvatarChange" />
              <span v-if="fieldErrors.avatar" class="block text-xs text-red-600">{{ fieldErrors.avatar[0] }}</span>
            </label>

            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Cover image</span>
              <div v-if="coverPreview" class="mb-2">
                <img :src="coverPreview" alt="Cover preview" class="h-20 w-full rounded-lg object-cover border border-slate-200" />
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" @change="onCoverChange" />
              <span v-if="fieldErrors.cover" class="block text-xs text-red-600">{{ fieldErrors.cover[0] }}</span>
            </label>
          </div>

          <label class="block space-y-1">
            <span class="text-sm font-medium text-slate-700">Resume / CV</span>
            <p v-if="profile?.resume" class="text-xs text-slate-500">Currently uploaded. Choose a file to replace.</p>
            <input type="file" accept=".pdf,.doc,.docx" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" @change="onResumeChange" />
            <span v-if="fieldErrors.resume" class="block text-xs text-red-600">{{ fieldErrors.resume[0] }}</span>
          </label>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Personal info</h2>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">First name</span>
              <input v-model="form.first_name" type="text" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Last name</span>
              <input v-model="form.last_name" type="text" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block space-y-1 sm:col-span-2">
              <span class="text-sm font-medium text-slate-700">Display name</span>
              <input v-model="form.display_name" type="text" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block space-y-1 sm:col-span-2">
              <span class="text-sm font-medium text-slate-700">Headline</span>
              <input v-model="form.headline" type="text" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block space-y-1 sm:col-span-2">
              <span class="text-sm font-medium text-slate-700">Tagline</span>
              <textarea v-model="form.tagline" rows="2" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"></textarea>
            </label>
            <label class="block space-y-1 sm:col-span-2">
              <span class="text-sm font-medium text-slate-700">Bio</span>
              <textarea v-model="form.bio" rows="5" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"></textarea>
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Location</span>
              <input v-model="form.location" type="text" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Roles (comma-separated)</span>
              <input v-model="form.roles_text" type="text" placeholder="IT Lecturer, Full-Stack Developer" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
          </div>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input v-model="form.available_for_work" type="checkbox" class="rounded border-slate-300" /> Available for work
          </label>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Contact & socials</h2>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Email (public)</span>
              <input v-model="form.email_public" type="email" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Phone</span>
              <input v-model="form.phone" type="tel" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Website</span>
              <input v-model="form.website" type="url" placeholder="https://" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">GitHub</span>
              <input v-model="form.github" type="url" placeholder="https://github.com/…" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">LinkedIn</span>
              <input v-model="form.linkedin" type="url" placeholder="https://linkedin.com/in/…" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Twitter</span>
              <input v-model="form.twitter" type="url" placeholder="https://twitter.com/…" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">WhatsApp</span>
              <input v-model="form.whatsapp" type="tel" placeholder="+251…" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
          </div>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Homepage stats</h2>
          <p class="text-xs text-slate-500">Projects, Publications, Technologies &amp; Years are re-counted live by the API from your data — these show that truth. Students Trained is the only stored value you edit here.</p>
          <div class="grid gap-3 sm:grid-cols-5">
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Years experience</span>
              <input v-model="form.experience_years" type="number" min="0" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Projects completed</span>
              <input v-model="form.projects_completed" type="number" min="0" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Publications</span>
              <input v-model="form.research_publications" type="number" min="0" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Technologies</span>
              <input v-model="form.technologies" type="number" min="0" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Students trained</span>
              <input v-model="form.students_trained" type="number" min="0" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
          </div>
        </section>

        <div class="flex justify-end">
          <button type="submit" :disabled="saving" class="btn-primary disabled:opacity-50">
            {{ saving ? 'Saving…' : 'Save profile' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
