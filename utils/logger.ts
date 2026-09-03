/**
 * Logger utility for consistent logging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

class Logger {
  private prefix = '[Compux]'

  private getTimestamp(): string {
    return new Date().toISOString()
  }

  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = this.getTimestamp()
    const logMessage = `${this.prefix} [${timestamp}] [${level.toUpperCase()}] ${message}`

    switch (level) {
      case 'error':
        console.error(logMessage, data)
        break
      case 'warn':
        console.warn(logMessage, data)
        break
      case 'debug':
        console.debug(logMessage, data)
        break
      default:
        console.log(logMessage, data)
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data)
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  error(message: string, data?: any) {
    this.log('error', message, data)
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data)
  }
}

export const logger = new Logger()
