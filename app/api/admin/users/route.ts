import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireSuperAdmin, hasAdminAccess, hasSuperAdminAccess } from '@/lib/roleMiddleware';
import { AuthenticatedUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import mongoose from 'mongoose';

async function handleGET(request: NextRequest, user: AuthenticatedUser) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') as UserRole;
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    // Get user statistics
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      }
    ]);

    const userStats = {
      total,
      byRole: stats.reduce((acc, stat) => {
        acc[stat._id] = { count: stat.count, active: stat.active };
        return acc;
      }, {} as Record<string, { count: number; active: number }>)
    };

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        stats: userStats
      }
    });
    
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users'
      },
      { status: 500 }
    );
  }
}

async function handlePUT(request: NextRequest, user: AuthenticatedUser) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, action, data } = body;
    
    if (!userId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId and action are required'
        },
        { status: 400 }
      );
    }

    // Validate userId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid user ID'
        },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found'
        },
        { status: 404 }
      );
    }

    switch (action) {
      case 'toggleActive':
        // Prevent users from deactivating themselves
        if (targetUser._id.toString() === user.userId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Cannot deactivate your own account'
            },
            { status: 400 }
          );
        }
        
        targetUser.isActive = !targetUser.isActive;
        await targetUser.save();
        
        return NextResponse.json({
          success: true,
          message: `User ${targetUser.isActive ? 'activated' : 'deactivated'} successfully`,
          data: { 
            userId: targetUser._id, 
            isActive: targetUser.isActive 
          }
        });

      case 'changeRole':
        // Only superadmins can change roles
        if (!hasSuperAdminAccess(user)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Only super admins can change user roles'
            },
            { status: 403 }
          );
        }

        // Prevent users from changing their own role
        if (targetUser._id.toString() === user.userId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Cannot change your own role'
            },
            { status: 400 }
          );
        }

        if (!data?.role || !['user', 'admin', 'superadmin'].includes(data.role)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Valid role is required (user, admin, superadmin)'
            },
            { status: 400 }
          );
        }
        
        targetUser.role = data.role;
        await targetUser.save();
        
        return NextResponse.json({
          success: true,
          message: `User role changed to ${data.role} successfully`,
          data: { 
            userId: targetUser._id, 
            role: targetUser.role 
          }
        });

      case 'updateProfile':
        // Users can only update name and email (not role)
        const allowedUpdates = ['name', 'email'];
        const updates: any = {};
        
        for (const key of allowedUpdates) {
          if (data?.[key] !== undefined) {
            updates[key] = data[key];
          }
        }
        
        if (Object.keys(updates).length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'No valid updates provided'
            },
            { status: 400 }
          );
        }
        
        // Check if email is already taken (if updating email)
        if (updates.email && updates.email !== targetUser.email) {
          const existingUser = await User.findOne({ email: updates.email });
          if (existingUser) {
            return NextResponse.json(
              {
                success: false,
                error: 'Email already in use'
              },
              { status: 400 }
            );
          }
        }
        
        Object.assign(targetUser, updates);
        await targetUser.save();
        
        return NextResponse.json({
          success: true,
          message: 'User profile updated successfully',
          data: { 
            userId: targetUser._id, 
            name: targetUser.name,
            email: targetUser.email
          }
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Supported actions: toggleActive, changeRole, updateProfile'
          },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('User management error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update user'
      },
      { status: 500 }
    );
  }
}

async function handleDELETE(request: NextRequest, user: AuthenticatedUser) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required'
        },
        { status: 400 }
      );
    }

    // Only superadmins can delete users
    if (!hasSuperAdminAccess(user)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only super admins can delete users'
        },
        { status: 403 }
      );
    }

    // Validate userId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid user ID'
        },
        { status: 400 }
      );
    }

    // Prevent users from deleting themselves
    if (userId === user.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete your own account'
        },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found'
        },
        { status: 404 }
      );
    }

    await User.findByIdAndDelete(userId);
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      data: { userId }
    });
    
  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete user'
      },
      { status: 500 }
    );
  }
}

// Export wrapped handlers with admin role requirement
export const GET = requireAdmin(handleGET);
export const PUT = requireAdmin(handlePUT);
export const DELETE = requireSuperAdmin(handleDELETE);