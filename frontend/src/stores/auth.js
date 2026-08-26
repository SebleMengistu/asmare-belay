import { defineStore } from 'pinia'
import http from '../api/http'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('tefera_token') || null,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },

  actions: {
    async login(email, password) {
      const { data } = await http.post('/auth/login', { email, password })
      this.user = data.user
      this.token = data.token
      localStorage.setItem('tefera_token', data.token)
    },

    async fetchMe() {
      if (!this.token) return
      const { data } = await http.get('/auth/me')
      this.user = data
    },

    async logout() {
      try {
        await http.post('/auth/logout')
      } finally {
        this.user = null
        this.token = ''
        localStorage.removeItem('tefera_token')
      }
    },
  },
})