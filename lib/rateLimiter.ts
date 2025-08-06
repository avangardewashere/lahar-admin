// Rate limiting system with in-memory storage (Redis-like functionality)

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RequestLog {
  id: string;
  method: string;
  endpoint: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  timestamp: number;
  responseTime?: number;
  statusCode?: number;
  blocked: boolean;
  reason?: string;
}

class RateLimiterStore {
  private store = new Map<string, RateLimitEntry>();
  private configs = new Map<string, RateLimitConfig>();
  private requestLogs: RequestLog[] = [];
  private maxLogSize = 10000; // Keep last 10k requests

  // Set rate limit configuration for an endpoint
  setConfig(endpoint: string, config: RateLimitConfig) {
    this.configs.set(endpoint, config);
  }

  // Get rate limit configuration for an endpoint
  getConfig(endpoint: string): RateLimitConfig {
    return this.configs.get(endpoint) || { windowMs: 60000, maxRequests: 100 }; // 100 req/min default
  }

  // Check if request should be rate limited
  checkRateLimit(key: string, endpoint: string): { allowed: boolean; remaining: number; resetTime: number; reason?: string } {
    const config = this.getConfig(endpoint);
    const now = Date.now();
    const entry = this.store.get(key);

    // Clean up expired entries periodically
    this.cleanup();

    if (!entry) {
      // First request for this key
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now,
      });
      return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
    }

    // Check if window has expired
    if (now > entry.resetTime) {
      // Reset the window
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now,
      });
      return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: entry.resetTime,
        reason: `Rate limit exceeded. Max ${config.maxRequests} requests per ${config.windowMs / 1000}s` 
      };
    }

    // Increment count
    entry.count += 1;
    return { allowed: true, remaining: config.maxRequests - entry.count, resetTime: entry.resetTime };
  }

  // Log a request
  logRequest(request: Omit<RequestLog, 'id' | 'timestamp'>) {
    const log: RequestLog = {
      ...request,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    this.requestLogs.push(log);

    // Keep only recent logs
    if (this.requestLogs.length > this.maxLogSize) {
      this.requestLogs = this.requestLogs.slice(-this.maxLogSize);
    }

    return log;
  }

  // Get request logs with optional filtering
  getRequestLogs(filter?: {
    endpoint?: string;
    ip?: string;
    userId?: string;
    blocked?: boolean;
    since?: number;
    limit?: number;
  }): RequestLog[] {
    let logs = [...this.requestLogs];

    if (filter) {
      if (filter.endpoint) {
        logs = logs.filter(log => log.endpoint === filter.endpoint);
      }
      if (filter.ip) {
        logs = logs.filter(log => log.ip === filter.ip);
      }
      if (filter.userId) {
        logs = logs.filter(log => log.userId === filter.userId);
      }
      if (filter.blocked !== undefined) {
        logs = logs.filter(log => log.blocked === filter.blocked);
      }
      if (filter.since) {
        logs = logs.filter(log => log.timestamp >= filter.since!);
      }
    }

    // Sort by timestamp (most recent first)
    logs.sort((a, b) => b.timestamp - a.timestamp);

    if (filter?.limit) {
      logs = logs.slice(0, filter.limit);
    }

    return logs;
  }

  // Get analytics data
  getAnalytics(timeWindow = 3600000): { // Default 1 hour
    requestsPerMinute: Array<{ timestamp: number; count: number; blocked: number }>;
    topEndpoints: Array<{ endpoint: string; count: number; blocked: number }>;
    topIPs: Array<{ ip: string; count: number; blocked: number }>;
    totalRequests: number;
    totalBlocked: number;
    averageResponseTime: number;
  } {
    const now = Date.now();
    const since = now - timeWindow;
    const logs = this.getRequestLogs({ since });

    // Requests per minute
    const minuteMap = new Map<number, { count: number; blocked: number }>();
    const endpointMap = new Map<string, { count: number; blocked: number }>();
    const ipMap = new Map<string, { count: number; blocked: number }>();

    let totalResponseTime = 0;
    let responseTimeCount = 0;

    logs.forEach(log => {
      const minute = Math.floor(log.timestamp / 60000) * 60000;
      
      // Per minute stats
      const minuteStats = minuteMap.get(minute) || { count: 0, blocked: 0 };
      minuteStats.count += 1;
      if (log.blocked) minuteStats.blocked += 1;
      minuteMap.set(minute, minuteStats);

      // Per endpoint stats
      const endpointStats = endpointMap.get(log.endpoint) || { count: 0, blocked: 0 };
      endpointStats.count += 1;
      if (log.blocked) endpointStats.blocked += 1;
      endpointMap.set(log.endpoint, endpointStats);

      // Per IP stats
      const ipStats = ipMap.get(log.ip) || { count: 0, blocked: 0 };
      ipStats.count += 1;
      if (log.blocked) ipStats.blocked += 1;
      ipMap.set(log.ip, ipStats);

      // Response time
      if (log.responseTime) {
        totalResponseTime += log.responseTime;
        responseTimeCount += 1;
      }
    });

    return {
      requestsPerMinute: Array.from(minuteMap.entries())
        .map(([timestamp, stats]) => ({ timestamp, ...stats }))
        .sort((a, b) => a.timestamp - b.timestamp),
      topEndpoints: Array.from(endpointMap.entries())
        .map(([endpoint, stats]) => ({ endpoint, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topIPs: Array.from(ipMap.entries())
        .map(([ip, stats]) => ({ ip, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      totalRequests: logs.length,
      totalBlocked: logs.filter(log => log.blocked).length,
      averageResponseTime: responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0,
    };
  }

  // Get current rate limit status for all active keys
  getCurrentStatus(): Array<{
    key: string;
    count: number;
    remaining: number;
    resetTime: number;
    endpoint?: string;
  }> {
    const now = Date.now();
    const status: Array<{
      key: string;
      count: number;
      remaining: number;
      resetTime: number;
      endpoint?: string;
    }> = [];

    this.store.forEach((entry, key) => {
      if (entry.resetTime > now) { // Only active entries
        const endpoint = key.includes(':') ? key.split(':').slice(1).join(':') : undefined;
        const config = endpoint ? this.getConfig(endpoint) : { maxRequests: 100, windowMs: 60000 };
        
        status.push({
          key,
          count: entry.count,
          remaining: Math.max(0, config.maxRequests - entry.count),
          resetTime: entry.resetTime,
          endpoint,
        });
      }
    });

    return status.sort((a, b) => b.count - a.count);
  }

  // Clean up expired entries
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime + 60000) { // Clean up entries that are 1 minute past expiry
        this.store.delete(key);
      }
    }
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Get total stats
  getTotalStats() {
    return {
      activeRateLimits: this.store.size,
      totalEndpoints: this.configs.size,
      totalRequests: this.requestLogs.length,
      configuredEndpoints: Array.from(this.configs.entries()).map(([endpoint, config]) => ({
        endpoint,
        ...config,
      })),
    };
  }
}

// Global instance
export const rateLimiter = new RateLimiterStore();

// Helper functions
export function getRateLimitKey(ip: string, endpoint: string, userId?: string): string {
  return userId ? `user:${userId}:${endpoint}` : `ip:${ip}:${endpoint}`;
}

export function initializeDefaultRateLimits() {
  // Set default rate limits for existing endpoints
  rateLimiter.setConfig('/api/tasks', { windowMs: 60000, maxRequests: 100 }); // 100 req/min
  rateLimiter.setConfig('/api/auth/login', { windowMs: 900000, maxRequests: 5 }); // 5 req/15min
  rateLimiter.setConfig('/api/auth/register', { windowMs: 3600000, maxRequests: 3 }); // 3 req/hour
}

// Initialize defaults
initializeDefaultRateLimits();