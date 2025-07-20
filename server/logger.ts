/**
 * Professional Logging System
 * 
 * Centralized logging with different levels and proper formatting.
 * Replaces console.log statements with structured logging.
 * 
 * @author Development Team
 * @version 1.0.0
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): string {
    const timestamp = this.formatTimestamp();
    const contextStr = context ? ` :: ${JSON.stringify(context)}` : '';
    const errorStr = error ? ` :: ${error.message}` : '';
    
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}${errorStr}`;
  }

  info(message: string, context?: Record<string, any>): void {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: Record<string, any>): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    console.error(this.formatMessage('error', message, context, error));
  }

  debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  // API specific logging methods
  apiRequest(method: string, path: string, statusCode: number, duration: number, response?: any): void {
    const context = {
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
      response: response ? JSON.stringify(response).slice(0, 100) : undefined
    };
    
    if (statusCode >= 500) {
      this.error(`API Error`, undefined, context);
    } else if (statusCode >= 400) {
      this.warn(`API Warning`, context);
    } else {
      this.info(`API Request`, context);
    }
  }

  apiError(method: string, path: string, error: Error): void {
    this.error(`API Error: ${method} ${path}`, error);
  }

  dbOperation(operation: string, table: string, duration?: number): void {
    const context = {
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined
    };
    this.debug(`Database Operation`, context);
  }

  cacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', key: string): void {
    this.debug(`Cache ${operation.toUpperCase()}`, { key });
  }
}

export const logger = new Logger();