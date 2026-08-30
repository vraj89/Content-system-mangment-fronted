import { create } from 'zustand'
import { storage } from '@/lib/storage'
import { apiPost } from '@/lib/apiClient'
import { apiClient } from '@/lib/apiClient'
import type { User } from '@/types/permissions'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  setUser: (user: User) => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: storage.getUser(),
  isAuthenticated: !!storage.getToken(),
  isLoading: false,

  hydrate: () => {
    const token = storage.getToken()
    const user = storage.getUser()
    set({ isAuthenticated: !!token, user })
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const data = await apiPost<{
        user: User
        accessToken: string
        refreshToken: string
      }>('/auth/login', { email, password })
      storage.setToken(data.accessToken)
      storage.setRefresh(data.refreshToken)
      storage.setUser(data.user)
      set({ user: data.user, isAuthenticated: true, isLoading: false })
      return data.user
    } catch (e) {
      set({ isLoading: false })
      throw e
    }
  },

  logout: async () => {
    try {
      await apiPost('/auth/logout', {})
    } catch {
      // ignore
    }
    storage.clearAll()
    set({ user: null, isAuthenticated: false })
  },

  fetchMe: async () => {
    if (!storage.getToken()) return
    try {
      const user = await apiClient.get<{ data: User }>('/auth/me').then((r) => r.data.data)
      storage.setUser(user)
      set({ user })
    } catch {
      // ignore
    }
  },

  setUser: (user) => {
    storage.setUser(user)
    set({ user })
  },
}))
