import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { withRateLimit, RATE_LIMIT_PRESETS } from '@/lib/rateLimitMiddleware';
import systemLogger from '@/lib/logger';

async function handlePOST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { email, password } = body;
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide email and password',
        },
        { status: 400 }
      );
    }

    // Find user by email and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      systemLogger.warn(`Failed login attempt for non-existent user: ${email}`, 'auth.login');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
        },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      systemLogger.warn(`Failed login attempt for user: ${email} (invalid password)`, 'auth.login', user._id.toString());
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
        },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    systemLogger.info(`Successful login for user: ${email} (${user.role})`, 'auth.login', user._id.toString(), { role: user.role });
    
    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
          },
          token,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    systemLogger.error(`Login API error: ${errorMessage}`, 'auth.login', undefined, { error: errorMessage });
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to login',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Export wrapped handler with rate limiting
export const POST = withRateLimit(handlePOST, '/api/auth/login', {
  skipWhen: (req) => false, // Apply rate limiting to all login requests
});