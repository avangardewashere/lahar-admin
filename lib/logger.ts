export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface SystemLog {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  source: string;
  userId?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private logs: SystemLog[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  log(level: LogLevel, message: string, source: string, userId?: string, metadata?: Record<string, any>): void {
    const logEntry: SystemLog = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message,
      source,
      userId,
      metadata
    };

    this.logs.unshift(logEntry); // Add to beginning for chronological order

    // Keep only the latest logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // In production, you would also persist to database/file/external service
    console.log(`[${logEntry.timestamp.toISOString()}] ${level} (${source}): ${message}`, metadata || '');
  }

  info(message: string, source: string, userId?: string, metadata?: Record<string, any>): void {
    this.log('INFO', message, source, userId, metadata);
  }

  warn(message: string, source: string, userId?: string, metadata?: Record<string, any>): void {
    this.log('WARN', message, source, userId, metadata);
  }

  error(message: string, source: string, userId?: string, metadata?: Record<string, any>): void {
    this.log('ERROR', message, source, userId, metadata);
  }

  debug(message: string, source: string, userId?: string, metadata?: Record<string, any>): void {
    this.log('DEBUG', message, source, userId, metadata);
  }

  getLogs(options?: {
    level?: LogLevel;
    source?: string;
    limit?: number;
    since?: Date;
  }): SystemLog[] {
    let filteredLogs = [...this.logs];

    if (options?.level) {
      filteredLogs = filteredLogs.filter(log => log.level === options.level);
    }

    if (options?.source) {
      filteredLogs = filteredLogs.filter(log => log.source.includes(options.source!));
    }

    if (options?.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= options.since!);
    }

    if (options?.limit) {
      filteredLogs = filteredLogs.slice(0, options.limit);
    }

    return filteredLogs;
  }

  getLogStats(since?: Date): {
    total: number;
    byLevel: Record<LogLevel, number>;
    recentActivity: Array<{
      timestamp: Date;
      message: string;
      level: LogLevel;
    }>;
  } {
    const relevantLogs = since 
      ? this.logs.filter(log => log.timestamp >= since)
      : this.logs;

    const byLevel = relevantLogs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<LogLevel, number>);

    // Ensure all levels are present
    const completeByLevel: Record<LogLevel, number> = {
      DEBUG: byLevel.DEBUG || 0,
      INFO: byLevel.INFO || 0,
      WARN: byLevel.WARN || 0,
      ERROR: byLevel.ERROR || 0
    };

    const recentActivity = relevantLogs
      .slice(0, 10)
      .map(log => ({
        timestamp: log.timestamp,
        message: log.message,
        level: log.level
      }));

    return {
      total: relevantLogs.length,
      byLevel: completeByLevel,
      recentActivity
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Method to clear logs (for testing/maintenance)
  clearLogs(): void {
    this.logs = [];
    this.info('System logs cleared', 'logger.service');
  }
}

// Singleton instance
const systemLogger = new Logger();

// Initialize with some startup logs
systemLogger.info('System logger initialized', 'logger.service');
systemLogger.info('Task management API system started', 'system.startup');
systemLogger.info('Database connection established', 'database.connection');
systemLogger.info('Authentication middleware loaded', 'auth.middleware');
systemLogger.info('Rate limiting service active', 'rate-limit.service');

export default systemLogger;