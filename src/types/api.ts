/**
 * Type definitions for API responses and common patterns
 */

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface UserProfile {
  id: string
  email: string
  name: string
  handle: string
  avatar: string
  bio: string
  university: string
  followers: number
  following: number
  isVerified: boolean
  isAdmin: boolean
}

export interface AuthState {
  isAuthenticated: boolean
  user: UserProfile | null
  loading: boolean
  error: string | null
}
