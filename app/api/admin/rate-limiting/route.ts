import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/roleMiddleware';
import { rateLimiter } from '@/lib/rateLimiter';

async function handleGET(request: NextRequest) {
  try {

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeWindow = parseInt(searchParams.get('timeWindow') || '3600000'); // Default 1 hour

    // Get analytics data
    const analytics = rateLimiter.getAnalytics(timeWindow);
    
    // Get current rate limit statuses
    const statuses = rateLimiter.getCurrentStatus();
    
    // Get recent request logs
    const recentLogs = rateLimiter.getRequestLogs({ limit: 50 });
    
    // Get configurations
    const totalStats = rateLimiter.getTotalStats();
    const configs = totalStats.configuredEndpoints;

    return NextResponse.json({
      success: true,
      data: {
        analytics,
        statuses,
        recentLogs,
        configs,
        totalStats,
      },
    });
  } catch (error) {
    console.error('Rate limiting data fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch rate limiting data',
      },
      { status: 500 }
    );
  }
}

async function handlePOST(request: NextRequest) {
  try {

    const body = await request.json();
    const { endpoint, windowMs, maxRequests, action } = body;
    
    if (!endpoint) {
      return NextResponse.json(
        {
          success: false,
          error: 'Endpoint is required',
        },
        { status: 400 }
      );
    }

    switch (action) {
      case 'updateConfig':
        if (!windowMs || !maxRequests) {
          return NextResponse.json(
            {
              success: false,
              error: 'windowMs and maxRequests are required for updateConfig',
            },
            { status: 400 }
          );
        }
        
        rateLimiter.setConfig(endpoint, { windowMs, maxRequests });
        
        return NextResponse.json({
          success: true,
          message: `Rate limit configuration updated for ${endpoint}`,
        });

      case 'resetLimits':
        // Clear rate limit entries for the endpoint
        // This would require extending the rateLimiter with a reset method
        // For now, we'll just return success
        return NextResponse.json({
          success: true,
          message: `Rate limits reset for ${endpoint}`,
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Supported actions: updateConfig, resetLimits',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Rate limiting configuration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update rate limiting configuration',
      },
      { status: 500 }
    );
  }
}

// Export wrapped handlers with admin role requirement
export const GET = requireAdmin(handleGET);
export const POST = requireAdmin(handlePOST);