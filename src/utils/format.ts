/**
 * Format utility for date and time
 */

export const formatUtils = {
  /**
   * Format date to readable string
   */
  formatDate(date: string | Date, locale = 'en-US'): string {
    const d = new Date(date)
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  },

  /**
   * Format time relative to now (e.g., "2 hours ago")
   */
  formatRelativeTime(date: string | Date): string {
    const d = new Date(date)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)

    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + 'y ago'

    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + 'mo ago'

    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + 'd ago'

    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + 'h ago'

    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + 'm ago'

    return Math.floor(seconds) + 's ago'
  },

  /**
   * Format number with commas
   */
  formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }
}
