/**
 * Constants and configuration for the application
 */

export const CONFIG = {
  // App info
  APP_NAME: 'Compux',
  APP_VERSION: '1.0.0',
  APP_URL: 'https://compux1.vercel.app',

  // API timeouts
  API_TIMEOUT: 30000, // 30 seconds
  API_RETRY_ATTEMPTS: 3,
  API_RETRY_DELAY: 1000, // 1 second

  // Pagination
  POSTS_PER_PAGE: 20,
  USERS_PER_PAGE: 15,
  COMMENTS_PER_PAGE: 10,

  // Validation
  MIN_PASSWORD_LENGTH: 8,
  MAX_BIO_LENGTH: 500,
  MAX_POST_LENGTH: 5000,
  MAX_COMMENT_LENGTH: 1000,

  // Toast notifications
  TOAST_DURATION: 3000, // 3 seconds

  // Session
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours

  // Debounce delays
  SEARCH_DEBOUNCE: 300, // 300ms
  RESIZE_DEBOUNCE: 250, // 250ms

  // Feature flags
  ENABLE_ANALYTICS: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ADMIN_PANEL: true,
} as const
