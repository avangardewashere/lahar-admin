import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/roleMiddleware';
import systemLogger from '@/lib/logger';

export const GET = requireAdmin(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level') as any;
    const source = searchParams.get('source') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const sinceParam = searchParams.get('since');
    
    const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours by default

    // Get filtered logs
    const logs = systemLogger.getLogs({
      level,
      source,
      limit,
      since
    });

    // Get statistics
    const stats = systemLogger.getLogStats(since);

    return NextResponse.json({
      success: true,
      data: {
        logs: logs.map(log => ({
          ...log,
          timestamp: log.timestamp.toISOString()
        })),
        stats: {
          ...stats,
          recentActivity: stats.recentActivity.map(activity => ({
            ...activity,
            timestamp: activity.timestamp.toISOString()
          }))
        }
      }
    });

  } catch (error) {
    console.error('System logs API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch system logs'
    }, { status: 500 });
  }
});

// POST endpoint for adding custom logs (admin only)
export const POST = requireAdmin(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const { level, message, source, metadata } = body;

    if (!level || !message || !source) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: level, message, source'
      }, { status: 400 });
    }

    systemLogger.log(level, message, source, user.userId, metadata);

    return NextResponse.json({
      success: true,
      message: 'Log entry created successfully'
    });

  } catch (error) {
    console.error('System logs POST API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create log entry'
    }, { status: 500 });
  }
});

// DELETE endpoint for clearing logs (superadmin only)
export const DELETE = requireAdmin(async (req: NextRequest, user) => {
  try {
    // Only superadmin can clear logs
    if (user.role !== 'superadmin') {
      return NextResponse.json({
        success: false,
        error: 'Only superadmin can clear system logs'
      }, { status: 403 });
    }

    systemLogger.clearLogs();
    systemLogger.info(`System logs cleared by ${user.email}`, 'admin.action', user.userId);

    return NextResponse.json({
      success: true,
      message: 'System logs cleared successfully'
    });

  } catch (error) {
    console.error('System logs DELETE API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to clear system logs'
    }, { status: 500 });
  }
});