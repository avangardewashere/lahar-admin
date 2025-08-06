import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import { AuthenticatedUser } from '@/lib/auth';
import { requireUser, hasAdminAccess } from '@/lib/roleMiddleware';
import { withEndpointCheck } from '@/lib/endpointMiddleware';
import { withRateLimit } from '@/lib/rateLimitMiddleware';

async function handleGET(request: NextRequest, user: AuthenticatedUser) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    // Base query for user's data
    const baseQuery = hasAdminAccess(user) ? {} : { userId: user.userId };
    
    // Overall statistics
    const overallStats = await Task.aggregate([
      { $match: { ...baseQuery, isArchived: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$dueDate', null] },
                    { $lt: ['$dueDate', new Date()] },
                    { $nin: ['$status', ['completed', 'cancelled']] }
                  ]
                },
                1,
                0
              ]
            }
          },
          avgEstimatedHours: { $avg: '$estimatedHours' },
          avgActualHours: { $avg: '$actualHours' },
          totalEstimatedHours: { $sum: '$estimatedHours' },
          totalActualHours: { $sum: '$actualHours' }
        }
      }
    ]);
    
    // Task completion over time
    const completionTrend = await Task.aggregate([
      {
        $match: {
          ...baseQuery,
          completedAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$completedAt' },
            month: { $month: '$completedAt' },
            day: { $dayOfMonth: '$completedAt' }
          },
          count: { $sum: 1 },
          avgHours: { $avg: '$actualHours' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Priority distribution
    const priorityDistribution = await Task.aggregate([
      { $match: { ...baseQuery, isArchived: false } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ]);
    
    // Status distribution over time
    const statusTrend = await Task.aggregate([
      {
        $match: {
          ...baseQuery,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            status: '$status',
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Category performance
    const categoryStats = await Task.aggregate([
      { 
        $match: { 
          ...baseQuery, 
          category: { $ne: null, $exists: true, $not: { $eq: '' } },
          isArchived: false 
        } 
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          avgEstimatedHours: { $avg: '$estimatedHours' },
          avgActualHours: { $avg: '$actualHours' }
        }
      },
      {
        $addFields: {
          completionRate: { $divide: ['$completed', '$total'] }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);
    
    // Most used tags
    const tagStats = await Task.aggregate([
      { $match: { ...baseQuery, tags: { $ne: [] } } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      {
        $addFields: {
          completionRate: { $divide: ['$completed', '$count'] }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    
    // Productivity insights
    const productivityInsights = await Task.aggregate([
      {
        $match: {
          ...baseQuery,
          completedAt: { $gte: startDate },
          status: 'completed',
          actualHours: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$completedAt' },
            hour: { $hour: '$completedAt' }
          },
          tasksCompleted: { $sum: 1 },
          avgHours: { $avg: '$actualHours' }
        }
      },
      { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } }
    ]);
    
    // Time estimation accuracy
    const estimationAccuracy = await Task.aggregate([
      {
        $match: {
          ...baseQuery,
          status: 'completed',
          estimatedHours: { $exists: true, $ne: null },
          actualHours: { $exists: true, $ne: null }
        }
      },
      {
        $addFields: {
          estimationDiff: { $subtract: ['$actualHours', '$estimatedHours'] },
          estimationAccuracyPct: {
            $multiply: [
              {
                $divide: [
                  { $subtract: ['$estimatedHours', { $abs: { $subtract: ['$actualHours', '$estimatedHours'] } }] },
                  '$estimatedHours'
                ]
              },
              100
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgEstimationDiff: { $avg: '$estimationDiff' },
          avgAccuracyPct: { $avg: '$estimationAccuracyPct' },
          underestimated: { $sum: { $cond: [{ $gt: ['$estimationDiff', 0] }, 1, 0] } },
          overestimated: { $sum: { $cond: [{ $lt: ['$estimationDiff', 0] }, 1, 0] } },
          accurate: { $sum: { $cond: [{ $eq: ['$estimationDiff', 0] }, 1, 0] } },
          total: { $sum: 1 }
        }
      }
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        period: parseInt(period),
        overall: overallStats[0] || {
          total: 0,
          completed: 0,
          inProgress: 0,
          todo: 0,
          cancelled: 0,
          overdue: 0,
          avgEstimatedHours: 0,
          avgActualHours: 0,
          totalEstimatedHours: 0,
          totalActualHours: 0
        },
        completionTrend,
        priorityDistribution,
        statusTrend,
        categoryStats,
        tagStats,
        productivityInsights,
        estimationAccuracy: estimationAccuracy[0] || {
          avgEstimationDiff: 0,
          avgAccuracyPct: 0,
          underestimated: 0,
          overestimated: 0,
          accurate: 0,
          total: 0
        }
      }
    });
    
  } catch (error) {
    console.error('Task analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch task analytics'
      },
      { status: 500 }
    );
  }
}

// Export wrapped handler
export const GET = withEndpointCheck(
  withRateLimit(requireUser(handleGET), '/api/tasks/analytics', {
    skipWhen: (req) => false
  }),
  'GET',
  '/api/tasks/analytics'
);