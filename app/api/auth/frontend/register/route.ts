import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { withRateLimit } from '@/lib/rateLimitMiddleware';

async function handlePOST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { email, password, name } = body;
    
    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide email, password, and name',
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User already exists with this email',
        },
        { status: 400 }
      );
    }
    
    // Create new frontend user (always 'user' role)
    const user = await User.create({
      email,
      password,
      name,
      role: 'user',
      isActive: true,
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    return NextResponse.json(
      {
        success: true,
        message: 'User account created successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
          },
          token,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Frontend registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create user account',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Export wrapped handler with rate limiting
export const POST = withRateLimit(handlePOST, '/api/auth/frontend/register', {
  skipWhen: (req) => false, // Apply rate limiting to all frontend registration requests
});