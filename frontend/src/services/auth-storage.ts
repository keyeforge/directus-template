import type { AuthenticationData, AuthenticationStorage } from '@directus/sdk'

const STORAGE_KEY = 'directus-auth'

export const authStorage: AuthenticationStorage = {
  get: () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw) as AuthenticationData
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
  },
  set: (value) => {
    if (value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      return
    }

    localStorage.removeItem(STORAGE_KEY)
  },
}
