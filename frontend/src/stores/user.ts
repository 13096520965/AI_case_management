import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: number
  username: string
  realName: string
  email: string
  role: string
  createdAt?: string
}

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || '')
  const userName = computed(() => user.value?.realName || user.value?.username || '')

  // Actions
  const setUser = (userData: User) => {
    user.value = userData
    error.value = null
  }

  const setToken = (tokenValue: string) => {
    token.value = tokenValue
    localStorage.setItem('token', tokenValue)
  }

  const login = (userData: User, tokenValue: string) => {
    setUser(userData)
    setToken(tokenValue)
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    error.value = null
  }

  const clearUser = () => {
    logout()
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const updateUserProfile = (updates: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...updates }
    }
  }

  // Check if user has specific role
  const hasRole = (role: string) => {
    return user.value?.role === role
  }

  // Initialize user from stored token
  const initializeAuth = () => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      token.value = storedToken
    }
  }

  return {
    // State
    user,
    token,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    userRole,
    userName,
    // Actions
    setUser,
    setToken,
    login,
    logout,
    clearUser,
    setLoading,
    setError,
    updateUserProfile,
    hasRole,
    initializeAuth
  }
})
