import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task, { TaskStatus, TaskPriority } from '@/models/Task';
import { AuthenticatedUser } from '@/lib/auth';
import { requireUser, hasAdminAccess } from '@/lib/roleMiddleware';
import { withEndpointCheck } from '@/lib/endpointMiddleware';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import systemLogger from '@/lib/logger';
import mongoose from 'mongoose';

async function handleGET(request: NextRequest, user: AuthenticatedUser) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 items per page
    const skip = (page - 1) * limit;
    
    // Filters
    const status = searchParams.get('status') as TaskStatus;
    const priority = searchParams.get('priority') as TaskPriority;
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const search = searchParams.get('search');
    const dueDateFrom = searchParams.get('dueDateFrom');
    const dueDateTo = searchParams.get('dueDateTo');
    const isArchived = searchParams.get('archived') === 'true';
    const assignedToMe = searchParams.get('assignedToMe') === 'true';
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    
    // Build query
    const query: any = { isArchived };
    
    // Role-based filtering: Users see only their tasks, admins see all
    if (!hasAdminAccess(user)) {
      if (assignedToMe) {
        query.$or = [
          { userId: user.userId },
          { assignedTo: user.userId }
        ];
      } else {
        query.userId = user.userId;
      }
    } else if (assignedToMe) {
      query.$or = [
        { userId: user.userId },
        { assignedTo: user.userId }
      ];
    }
    
    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = { $regex: category, $options: 'i' };
    if (tags && tags.length > 0) query.tags = { $in: tags };
    
    // Date range filter
    if (dueDateFrom || dueDateTo) {
      query.dueDate = {};
      if (dueDateFrom) query.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) query.dueDate.$lte = new Date(dueDateTo);
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get tasks with pagination
    const tasks = await Task.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .lean();
    
    // Get total count for pagination
    const total = await Task.countDocuments(query);
    
    // Get summary statistics
    const baseStatsQuery = hasAdminAccess(user) ? { isArchived: false } : { userId: user.userId, isArchived: false };
    const stats = await Task.aggregate([
      { $match: baseStatsQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$dueDate', null] },
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$status', 'completed'] },
                    { $ne: ['$status', 'cancelled'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    systemLogger.info(`Tasks fetched: ${tasks.length} results for user ${user.email}`, 'api.tasks', user.userId, { 
      filters: { status, priority, category, tags, search }, 
      resultsCount: tasks.length,
      isAdmin: hasAdminAccess(user)
    });

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        stats: stats[0] || {
          total: 0,
          todo: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0,
          overdue: 0
        }
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    systemLogger.error(`Task fetch error: ${errorMessage}`, 'api.tasks', user?.userId, { error: errorMessage });
    console.error('Task fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tasks'
      },
      { status: 500 }
    );
  }
}

async function handlePOST(request: NextRequest, user: AuthenticatedUser) {
  try {
    await connectDB();
    const body = await request.json();
    
    const {
      title,
      description,
      status = 'todo',
      priority = 'medium',
      category,
      tags = [],
      dueDate,
      startDate,
      estimatedHours,
      assignedTo = [],
      subtasks = []
    } = body;
    
    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task title is required'
        },
        { status: 400 }
      );
    }
    
    // Validate assignedTo users exist (if provided)
    if (assignedTo.length > 0) {
      const validUserIds = assignedTo.filter((id: string) => 
        mongoose.Types.ObjectId.isValid(id)
      );
      
      if (validUserIds.length !== assignedTo.length) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid user IDs in assignedTo field'
          },
          { status: 400 }
        );
      }
    }
    
    // Generate IDs for subtasks
    const processedSubtasks = subtasks.map((subtask: any) => ({
      id: new mongoose.Types.ObjectId().toString(),
      title: subtask.title,
      completed: false,
      createdAt: new Date()
    }));
    
    // Create task
    const task = await Task.create({
      title: title.trim(),
      description: description?.trim(),
      status,
      priority,
      category: category?.trim(),
      tags: Array.isArray(tags) ? tags.map((tag: string) => tag.trim()).filter(Boolean) : [],
      dueDate: dueDate ? new Date(dueDate) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      estimatedHours,
      assignedTo: assignedTo.length > 0 ? assignedTo : undefined,
      subtasks: processedSubtasks,
      userId: user.userId,
      createdBy: user.userId,
      attachments: [],
      isArchived: false
    });
    
    // Populate user references
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    systemLogger.info(`Task created: "${task.title}" by ${user.email}`, 'api.tasks', user.userId, {
      taskId: task._id.toString(),
      priority: task.priority,
      category: task.category,
      assignedCount: task.assignedTo?.length || 0
    });
    
    return NextResponse.json(
      {
        success: true,
        data: task
      },
      { status: 201 }
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    systemLogger.error(`Task creation error: ${errorMessage}`, 'api.tasks', user?.userId, { error: errorMessage });
    console.error('Task creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create task',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

// Export wrapped handlers with role checking, endpoint status checking and rate limiting
export const GET = withEndpointCheck(
  withRateLimit(requireUser(handleGET), '/api/tasks', {
    skipWhen: (req) => false
  }),
  'GET', 
  '/api/tasks'
);

export const POST = withEndpointCheck(
  withRateLimit(requireUser(handlePOST), '/api/tasks', {
    skipWhen: (req) => false
  }),
  'POST', 
  '/api/tasks'
);