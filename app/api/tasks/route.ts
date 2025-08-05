import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import { verifyToken, createAuthResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      return createAuthResponse();
    }

    await connectDB();
    const tasks = await Task.find({ userId: user.userId }).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tasks',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      return createAuthResponse();
    }

    await connectDB();
    const body = await request.json();
    
    const { title, description, priority } = body;
    
    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title is required',
        },
        { status: 400 }
      );
    }
    
    const task = await Task.create({
      title,
      description,
      priority: priority || 'medium',
      userId: user.userId,
    });
    
    return NextResponse.json(
      {
        success: true,
        data: task,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}