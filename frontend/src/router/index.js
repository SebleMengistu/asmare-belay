import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import CrudTable from '../components/admin/CrudTable.vue'
import { RESOURCES } from '../api/resources'

const adminCrud = (key) => ({
  component: CrudTable,
  props: { resourceKey: key, config: RESOURCES[key] },
})

const routes = [
  // ── Public routes ────────────────────────────────────────────────────────
  { path: '/',               name: 'home',         component: () => import('../views/HomeView.vue') },
  { path: '/about',          name: 'about',        component: () => import('../views/AboutView.vue') },
  { path: '/projects',       name: 'projects',     component: () => import('../views/ProjectsView.vue') },
  { path: '/projects/:slug', name: 'project',      component: () => import('../views/ProjectView.vue') },
  { path: '/posts',          name: 'posts',        component: () => import('../views/PostsView.vue') },
  { path: '/posts/:slug',    name: 'post',         component: () => import('../views/PostView.vue') },
  { path: '/publications',   name: 'publications', component: () => import('../views/PublicationsView.vue') },
  { path: '/research',       name: 'research',     component: () => import('../views/ResearchView.vue') },
  { path: '/experience',     name: 'experience',   component: () => import('../views/ExperienceView.vue') },
  { path: '/education',      name: 'education',    component: () => import('../views/EducationView.vue') },
  { path: '/technologies',   name: 'technologies', component: () => import('../views/TechnologiesView.vue') },
  { path: '/certifications', name: 'certifications', component: () => import('../views/CertificationsView.vue') },
  { path: '/achievements',   name: 'achievements', component: () => import('../views/AchievementsView.vue') },
  { path: '/conferences',    name: 'conferences',  component: () => import('../views/ConferencesView.vue') },
  { path: '/services',       name: 'services',     component: () => import('../views/ServicesView.vue') },
  { path: '/cv',             name: 'cv',           component: () => import('../views/CvView.vue') },
  { path: '/contact',        name: 'contact',      component: () => import('../views/ContactView.vue') },
  { path: '/feedback',       name: 'feedback',     component: () => import('../views/FeedbackView.vue') },
  { path: '/search',         name: 'search',       component: () => import('../views/SearchView.vue') },

  // ── Admin login — standalone, no auth required, no public chrome ─────────
  // Must be declared BEFORE the /admin parent so Vue Router matches it first.
  {
    path: '/admin/login',
    name: 'admin.login',
    component: () => import('../views/admin/LoginView.vue'),
    meta: { chrome: false },
  },

  // ── Protected admin area — wrapped in AdminLayout ─────────────────────────
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, chrome: false },
    children: [
      { path: '',               name: 'admin.dashboard',    component: () => import('../views/admin/DashboardView.vue') },
      { path: 'profile',        name: 'admin.profile',      component: () => import('../views/admin/ProfileAdminView.vue') },
      { path: 'projects',       name: 'admin.projects',     component: () => import('../views/admin/ProjectsAdminView.vue') },
      { path: 'posts',          name: 'admin.posts',        component: () => import('../views/admin/PostsAdminView.vue') },
      { path: 'skills',         name: 'admin.skills',       ...adminCrud('skills') },
      { path: 'experiences',    name: 'admin.experiences',  ...adminCrud('experiences') },
      { path: 'educations',     name: 'admin.educations',   ...adminCrud('educations') },
      { path: 'certifications', name: 'admin.certifications', ...adminCrud('certifications') },
      { path: 'publications',   name: 'admin.publications', ...adminCrud('publications') },
      { path: 'achievements',   name: 'admin.achievements', ...adminCrud('achievements') },
      { path: 'languages',      name: 'admin.languages',    ...adminCrud('languages') },
      { path: 'conferences',    name: 'admin.conferences',  ...adminCrud('conferences') },
      { path: 'research',       name: 'admin.research',     ...adminCrud('research') },
      { path: 'cv',             name: 'admin.cv',           component: () => import('../views/admin/CvAdminView.vue') },
      { path: 'services',       name: 'admin.services',     ...adminCrud('services') },
      { path: 'testimonials',   name: 'admin.testimonials', ...adminCrud('testimonials') },
      { path: 'messages',       name: 'admin.messages',     component: () => import('../views/admin/MessagesView.vue') },
      { path: 'feedback',       name: 'admin.feedback',     component: () => import('../views/admin/FeedbackView.vue') },
      { path: 'media',          name: 'admin.media',        component: () => import('../views/admin/MediaLibraryView.vue') },
    ],
  },

  // ── 404 ──────────────────────────────────────────────────────────────────
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Check requiresAuth across the full matched hierarchy (parent + children)
  const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth)
  const isLoginPage = to.name === 'admin.login'

  // Token present but user not loaded yet — validate session before deciding
  if (auth.isAuthenticated && requiresAuth && !auth.user) {
    try {
      await auth.fetchMe()
    } catch {
      await auth.logout()
      return { name: 'admin.login', query: { redirect: to.fullPath } }
    }
  }

  // Not authenticated → redirect to login
  if (requiresAuth && !auth.isAuthenticated) {
    return { name: 'admin.login', query: { redirect: to.fullPath } }
  }

  // Already logged in → skip login page
  if (isLoginPage && auth.isAuthenticated) {
    return { name: 'admin.dashboard' }
  }

  return true
})

export default router
