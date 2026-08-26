import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import CrudTable from '../components/admin/CrudTable.vue'
import { RESOURCES } from '../api/resources'

// Generic admin CRUD routes render CrudTable directly; no per-resource
// wrapper view files needed.
const adminCrud = (key) => ({
  component: CrudTable,
  props: { resourceKey: key, config: RESOURCES[key] },
})

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/projects', name: 'projects', component: () => import('../views/ProjectsView.vue') },
  { path: '/projects/:slug', name: 'project', component: () => import('../views/ProjectView.vue') },
  { path: '/posts', name: 'posts', component: () => import('../views/PostsView.vue') },
  { path: '/posts/:slug', name: 'post', component: () => import('../views/PostView.vue') },
  { path: '/services', name: 'services', component: () => import('../views/ServicesView.vue') },
  { path: '/contact', name: 'contact', component: () => import('../views/ContactView.vue') },
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    // chrome:false tells App.vue to hide the public site header/footer.
    meta: { requiresAuth: true, chrome: false },
    children: [
      { path: '', name: 'admin.dashboard', component: () => import('../views/admin/DashboardView.vue') },
      { path: 'projects', name: 'admin.projects', component: () => import('../views/admin/ProjectsAdminView.vue') },
      { path: 'skills', name: 'admin.skills', ...adminCrud('skills') },
      { path: 'experiences', name: 'admin.experiences', ...adminCrud('experiences') },
      { path: 'educations', name: 'admin.educations', ...adminCrud('educations') },
      { path: 'certifications', name: 'admin.certifications', ...adminCrud('certifications') },
      { path: 'publications', name: 'admin.publications', ...adminCrud('publications') },
      { path: 'services', name: 'admin.services', ...adminCrud('services') },
      { path: 'testimonials', name: 'admin.testimonials', ...adminCrud('testimonials') },
      { path: 'messages', name: 'admin.messages', component: () => import('../views/admin/MessagesView.vue') },
    ],
  },
  { path: '/admin/login', name: 'admin.login', component: () => import('../views/admin/LoginView.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const publicAdmin = to.name === 'admin.login'

  if (auth.isAuthenticated && !auth.user) {
    try {
      await auth.fetchMe()
    } catch {
      await auth.logout()
    }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'admin.login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'admin.login' && auth.isAuthenticated) {
    return { name: 'admin.dashboard' }
  }

  return publicAdmin || true
})

export default router