import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import { AuthenticatedUser } from '@/lib/auth';
import { requireUser, hasAdminAccess } from '@/lib/roleMiddleware';
import { withEndpointCheck } from '@/lib/endpointMiddleware';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function handleGET(request: NextRequest, user: AuthenticatedUser, { params }: RouteParams) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    // Validate task ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid task ID'
        },
        { status: 400 }
      );
    }
    
    // Build query - users can only access their own tasks unless admin
    const query: any = { _id: id };
    if (!hasAdminAccess(user)) {
      query.$or = [
        { userId: user.userId },
        { assignedTo: user.userId }
      ];
    }
    
    const task = await Task.findOne(query)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('userId', 'name email role');
    
    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: task
    });
    
  } catch (error) {
    console.error('Task fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch task'
      },
      { status: 500 }
    );
  }
}

async function handlePUT(request: NextRequest, user: AuthenticatedUser, { params }: RouteParams) {
  try {
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    
    // Validate task ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid task ID'
        },
        { status: 400 }
      );
    }
    
    // Find task with access control
    const query: any = { _id: id };
    if (!hasAdminAccess(user)) {
      query.$or = [
        { userId: user.userId },
        { assignedTo: user.userId }
      ];
    }
    
    const task = await Task.findOne(query);
    
    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found'
        },
        { status: 404 }
      );
    }
    
    // Extract updatable fields
    const {
      title,
      description,
      status,
      priority,
      category,
      tags,
      dueDate,
      startDate,
      estimatedHours,
      actualHours,
      assignedTo,
      subtasks,
      isArchived
    } = body;
    
    // Validate assignedTo if provided
    if (assignedTo && Array.isArray(assignedTo) && assignedTo.length > 0) {
      const validUserIds = assignedTo.filter((userId: string) => 
        mongoose.Types.ObjectId.isValid(userId)
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
    
    // Process subtasks - maintain existing IDs and add new ones
    let processedSubtasks = task.subtasks;
    if (subtasks && Array.isArray(subtasks)) {
      processedSubtasks = subtasks.map((subtask: any) => ({
        id: subtask.id || new mongoose.Types.ObjectId().toString(),
        title: subtask.title,
        completed: Boolean(subtask.completed),
        createdAt: subtask.createdAt ? new Date(subtask.createdAt) : new Date()
      }));
    }
    
    // Build update object
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (category !== undefined) updateData.category = category?.trim();
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags.map((tag: string) => tag.trim()).filter(Boolean) : [];
    }
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;
    if (actualHours !== undefined) updateData.actualHours = actualHours;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (subtasks !== undefined) updateData.subtasks = processedSubtasks;
    if (isArchived !== undefined) updateData.isArchived = Boolean(isArchived);
    
    // Update task
    const updatedTask = await Task.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('userId', 'name email role');
    
    return NextResponse.json({
      success: true,
      data: updatedTask
    });
    
  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update task',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleDELETE(request: NextRequest, user: AuthenticatedUser, { params }: RouteParams) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    // Validate task ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid task ID'
        },
        { status: 400 }
      );
    }
    
    // Find task with access control - only task owner or admin can delete
    const query: any = { _id: id };
    if (!hasAdminAccess(user)) {
      query.userId = user.userId; // Only task owner can delete (not assignees)
    }
    
    const task = await Task.findOneAndDelete(query);
    
    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found or insufficient permissions'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
      data: { id: task._id }
    });
    
  } catch (error) {
    console.error('Task deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete task'
      },
      { status: 500 }
    );
  }
}

// Export handlers with proper Next.js App Router signature
export async function GET(request: NextRequest, context: RouteParams) {
  return withEndpointCheck(
    withRateLimit(
      requireUser(async (req: NextRequest, user: AuthenticatedUser) => 
        handleGET(req, user, context)
      ), 
      '/api/tasks/[id]',
      { skipWhen: (req) => false }
    ),
    'GET',
    '/api/tasks/[id]'
  )(request);
}

export async function PUT(request: NextRequest, context: RouteParams) {
  return withEndpointCheck(
    withRateLimit(
      requireUser(async (req: NextRequest, user: AuthenticatedUser) => 
        handlePUT(req, user, context)
      ),
      '/api/tasks/[id]',
      { skipWhen: (req) => false }
    ),
    'PUT',
    '/api/tasks/[id]'
  )(request);
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  return withEndpointCheck(
    withRateLimit(
      requireUser(async (req: NextRequest, user: AuthenticatedUser) => 
        handleDELETE(req, user, context)
      ),
      '/api/tasks/[id]',
      { skipWhen: (req) => false }
    ),
    'DELETE',
    '/api/tasks/[id]'
  )(request);
}