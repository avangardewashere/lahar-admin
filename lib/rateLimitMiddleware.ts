import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, getRateLimitKey } from './rateLimiter';
import { verifyToken } from './auth';

export interface RateLimitOptions {
  keyGenerator?: (req: NextRequest, endpoint: string) => string;
  skipWhen?: (req: NextRequest) => boolean;
  onRateLimitExceeded?: (req: NextRequest, info: any) => NextResponse;
}

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  endpoint: string,
  options: RateLimitOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    
    try {
      // Skip rate limiting if condition is met
      if (options.skipWhen && options.skipWhen(req)) {
        const response = await handler(req);
        logRequest(req, endpoint, false, Date.now() - startTime, response.status);
        return response;
      }

      // Get client IP
      const ip = getClientIP(req);
      
      // Get user ID if authenticated (optional)
      let userId: string | undefined;
      try {
        const user = await verifyToken(req);
        userId = user?.userId;
      } catch (error) {
        // Ignore auth errors for rate limiting purposes
      }

      // Generate rate limit key
      const rateLimitKey = options.keyGenerator 
        ? options.keyGenerator(req, endpoint)
        : getRateLimitKey(ip, endpoint, userId);

      // Check rate limit
      const rateLimitResult = rateLimiter.checkRateLimit(rateLimitKey, endpoint);

      if (!rateLimitResult.allowed) {
        // Rate limit exceeded
        logRequest(req, endpoint, true, Date.now() - startTime, 429, rateLimitResult.reason, userId);
        
        if (options.onRateLimitExceeded) {
          return options.onRateLimitExceeded(req, rateLimitResult);
        }

        return NextResponse.json(
          {
            success: false,
            error: 'Too Many Requests',
            message: rateLimitResult.reason,
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimiter.getConfig(endpoint).maxRequests.toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
              'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            }
          }
        );
      }

      // Process request
      const response = await handler(req);
      const responseTime = Date.now() - startTime;

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', rateLimiter.getConfig(endpoint).maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());

      // Log successful request
      logRequest(req, endpoint, false, responseTime, response.status, undefined, userId);

      return response;

    } catch (error) {
      // Log error
      const responseTime = Date.now() - startTime;
      logRequest(req, endpoint, false, responseTime, 500, error instanceof Error ? error.message : 'Unknown error');
      
      // Re-throw the error to be handled by the original handler
      throw error;
    }
  };
}

function getClientIP(req: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback IP address (req.ip not available in Next.js Edge runtime)
  return '127.0.0.1';
}

function logRequest(
  req: NextRequest,
  endpoint: string,
  blocked: boolean,
  responseTime: number,
  statusCode: number,
  reason?: string,
  userId?: string
) {
  const ip = getClientIP(req);
  const userAgent = req.headers.get('user-agent') || undefined;

  rateLimiter.logRequest({
    method: req.method,
    endpoint,
    ip,
    userAgent,
    userId,
    responseTime,
    statusCode,
    blocked,
    reason,
  });
}

// Predefined rate limit configurations
export const RATE_LIMIT_PRESETS = {
  STRICT: { windowMs: 60000, maxRequests: 10 }, // 10 req/min
  MODERATE: { windowMs: 60000, maxRequests: 60 }, // 60 req/min  
  LENIENT: { windowMs: 60000, maxRequests: 200 }, // 200 req/min
  AUTH_LOGIN: { windowMs: 900000, maxRequests: 5 }, // 5 req/15min
  AUTH_REGISTER: { windowMs: 3600000, maxRequests: 3 }, // 3 req/hour
  PUBLIC_API: { windowMs: 60000, maxRequests: 1000 }, // 1000 req/min
} as const;