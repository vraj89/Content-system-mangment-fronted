const TOKEN_KEY = 'csm.accessToken'
const REFRESH_KEY = 'csm.refreshToken'
const USER_KEY = 'csm.user'

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setRefresh: (t: string) => localStorage.setItem(REFRESH_KEY, t),
  clearRefresh: () => localStorage.removeItem(REFRESH_KEY),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as import('@/types/permissions').User) : null
  },
  setUser: (u: import('@/types/permissions').User) =>
    localStorage.setItem(USER_KEY, JSON.stringify(u)),
  clearUser: () => localStorage.removeItem(USER_KEY),
  clearAll: () => {
    storage.clearToken()
    storage.clearRefresh()
    storage.clearUser()
  },
}
