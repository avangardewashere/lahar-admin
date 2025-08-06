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
    const includeStats = searchParams.get('includeStats') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    
    // Base query for user's data
    const baseQuery = hasAdminAccess(user) ? {} : { userId: user.userId };
    
    if (includeStats) {
      // Get categories with statistics
      const categories = await Task.aggregate([
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
            totalTasks: { $sum: 1 },
            completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            inProgressTasks: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
            todoTasks: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
            overdueTasks: {
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
            lastTaskCreated: { $max: '$createdAt' },
            lastTaskCompleted: { $max: '$completedAt' }
          }
        },
        {
          $addFields: {
            category: '$_id',
            completionRate: { $divide: ['$completedTasks', '$totalTasks'] }
          }
        },
        {
          $project: {
            _id: 0,
            category: 1,
            totalTasks: 1,
            completedTasks: 1,
            inProgressTasks: 1,
            todoTasks: 1,
            overdueTasks: 1,
            completionRate: 1,
            avgEstimatedHours: { $round: ['$avgEstimatedHours', 2] },
            avgActualHours: { $round: ['$avgActualHours', 2] },
            lastTaskCreated: 1,
            lastTaskCompleted: 1
          }
        },
        { $sort: { totalTasks: -1, category: 1 } },
        { $limit: limit }
      ]);
      
      return NextResponse.json({
        success: true,
        data: categories
      });
      
    } else {
      // Get simple list of categories
      const categories = await Task.distinct('category', {
        ...baseQuery,
        category: { $ne: null, $exists: true, $not: { $eq: '' } },
        isArchived: false
      });
      
      return NextResponse.json({
        success: true,
        data: categories.sort()
      });
    }
    
  } catch (error) {
    console.error('Categories fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories'
      },
      { status: 500 }
    );
  }
}

// Export wrapped handler
export const GET = withEndpointCheck(
  withRateLimit(requireUser(handleGET), '/api/tasks/categories', {
    skipWhen: (req) => false
  }),
  'GET',
  '/api/tasks/categories'
);