import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import jwt from 'jsonwebtoken';
import { requireSuperAdmin } from '@/lib/roleMiddleware';
import { withRateLimit } from '@/lib/rateLimitMiddleware';

// Admin registration endpoint - only accessible by super admins
async function handlePOST(request: NextRequest, currentUser: any) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { email, password, name, role = 'admin' } = body;
    
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

    // Validate role
    if (!['admin', 'superadmin'].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid role. Only admin or superadmin roles allowed.',
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
    
    // Create new admin user
    const user = await User.create({
      email,
      password,
      name,
      role: role as UserRole,
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
        message: `${role} user created successfully`,
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
    console.error('Admin registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create admin user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Public admin registration with invite code (for initial setup)
async function handlePOSTPublic(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { email, password, name, inviteCode } = body;
    
    // Validate required fields
    if (!email || !password || !name || !inviteCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide email, password, name, and invite code',
        },
        { status: 400 }
      );
    }

    // Validate invite code
    const validInviteCodes = [
      process.env.ADMIN_INVITE_CODE,
      process.env.SUPER_ADMIN_INVITE_CODE
    ].filter(Boolean);
    
    if (!validInviteCodes.includes(inviteCode)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid invite code',
        },
        { status: 403 }
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

    // Check if there are existing admin/superadmin users for security
    const adminCount = await User.countDocuments({
      role: { $in: ['admin', 'superadmin'] }
    });

    // If there are already admins, require super admin authorization
    if (adminCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin registration requires authorization from existing super admin',
        },
        { status: 403 }
      );
    }
    
    // Determine role based on invite code
    let role: UserRole = 'admin';
    if (inviteCode === process.env.SUPER_ADMIN_INVITE_CODE) {
      role = 'superadmin';
    }
    
    // Create new admin user (only allowed for initial setup)
    const user = await User.create({
      email,
      password,
      name,
      role,
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
        message: `First ${role} user created successfully`,
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
    console.error('Admin registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create admin user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Check if this is an initial setup (no admins exist)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const adminCount = await User.countDocuments({
      role: { $in: ['admin', 'superadmin'] }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        requiresInitialSetup: adminCount === 0,
        adminCount
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check setup status'
      },
      { status: 500 }
    );
  }
}

// Route handler that decides between authenticated admin creation or initial setup
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Check if there are existing admins
    const adminCount = await User.countDocuments({
      role: { $in: ['admin', 'superadmin'] }
    });
    
    if (adminCount === 0) {
      // Initial setup - allow public registration with invite code
      return withRateLimit(handlePOSTPublic, '/api/auth/admin/register', {
        skipWhen: (req) => false
      })(request);
    } else {
      // Require super admin authentication
      return withRateLimit(requireSuperAdmin(handlePOST), '/api/auth/admin/register', {
        skipWhen: (req) => false
      })(request);
    }
  } catch (error) {
    console.error('Admin registration route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process admin registration'
      },
      { status: 500 }
    );
  }
}