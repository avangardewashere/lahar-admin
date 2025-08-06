import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import jwt from 'jsonwebtoken';
import { withRateLimit, RATE_LIMIT_PRESETS } from '@/lib/rateLimitMiddleware';

async function handlePOST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { email, password, name, registrationSource, inviteCode } = body;
    
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
    
    // Determine user role based on registration source
    let userRole: UserRole = 'user'; // default role
    
    if (registrationSource === 'admin') {
      // Admin dashboard registration - requires invite code for security
      const validAdminInviteCodes = [
        process.env.ADMIN_INVITE_CODE,
        process.env.SUPER_ADMIN_INVITE_CODE
      ].filter(Boolean);
      
      if (!inviteCode || !validAdminInviteCodes.includes(inviteCode)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Valid admin invite code is required for admin registration',
          },
          { status: 403 }
        );
      }
      
      // Assign role based on invite code
      if (inviteCode === process.env.SUPER_ADMIN_INVITE_CODE) {
        userRole = 'superadmin';
      } else if (inviteCode === process.env.ADMIN_INVITE_CODE) {
        userRole = 'admin';
      }
      
    } else if (registrationSource === 'frontend' || registrationSource === 'app') {
      // Frontend/app registration - regular user
      userRole = 'user';
    } else {
      // Default registration source detection based on user agent or referrer
      const userAgent = request.headers.get('user-agent') || '';
      const referer = request.headers.get('referer') || '';
      
      // Check if request comes from admin dashboard
      if (referer.includes('/admin') || referer.includes('admin.')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Admin registration requires invite code',
          },
          { status: 403 }
        );
      }
      
      // Default to user role for frontend registration
      userRole = 'user';
    }
    
    // Create new user with determined role
    const user = await User.create({
      email,
      password,
      name,
      role: userRole,
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
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Export wrapped handler with rate limiting
export const POST = withRateLimit(handlePOST, '/api/auth/register', {
  skipWhen: (req) => false, // Apply rate limiting to all registration requests
});