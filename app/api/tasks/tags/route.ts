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
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);
    const search = searchParams.get('search');
    
    // Base query for user's data
    const baseQuery = hasAdminAccess(user) ? {} : { userId: user.userId };
    
    if (includeStats) {
      // Build aggregation pipeline
      const pipeline: any[] = [
        {
          $match: {
            ...baseQuery,
            tags: { $ne: [] },
            isArchived: false
          }
        },
        { $unwind: '$tags' }
      ];
      
      // Add search filter if provided
      if (search) {
        pipeline.push({
          $match: {
            tags: { $regex: search, $options: 'i' }
          }
        });
      }
      
      // Continue with grouping and statistics
      pipeline.push(
        {
          $group: {
            _id: '$tags',
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
            lastUsed: { $max: '$createdAt' }
          }
        },
        {
          $addFields: {
            tag: '$_id',
            completionRate: { $divide: ['$completedTasks', '$totalTasks'] }
          }
        },
        {
          $project: {
            _id: 0,
            tag: 1,
            totalTasks: 1,
            completedTasks: 1,
            inProgressTasks: 1,
            todoTasks: 1,
            overdueTasks: 1,
            completionRate: 1,
            avgEstimatedHours: { $round: ['$avgEstimatedHours', 2] },
            avgActualHours: { $round: ['$avgActualHours', 2] },
            lastUsed: 1
          }
        },
        { $sort: { totalTasks: -1, tag: 1 } },
        { $limit: limit }
      );
      
      const tags = await Task.aggregate(pipeline);
      
      return NextResponse.json({
        success: true,
        data: tags
      });
      
    } else {
      // Get simple list of tags
      let pipeline: any[] = [
        {
          $match: {
            ...baseQuery,
            tags: { $ne: [] },
            isArchived: false
          }
        },
        { $unwind: '$tags' },
        { $group: { _id: '$tags' } },
        { $project: { _id: 0, tag: '$_id' } },
        { $sort: { tag: 1 } }
      ];
      
      // Add search filter if provided
      if (search) {
        pipeline.splice(2, 0, {
          $match: {
            tags: { $regex: search, $options: 'i' }
          }
        });
      }
      
      pipeline.push({ $limit: limit });
      
      const tags = await Task.aggregate(pipeline);
      
      return NextResponse.json({
        success: true,
        data: tags.map(item => item.tag)
      });
    }
    
  } catch (error) {
    console.error('Tags fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tags'
      },
      { status: 500 }
    );
  }
}

// Export wrapped handler
export const GET = withEndpointCheck(
  withRateLimit(requireUser(handleGET), '/api/tasks/tags', {
    skipWhen: (req) => false
  }),
  'GET',
  '/api/tasks/tags'
);