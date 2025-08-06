import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createAuthResponse, AuthenticatedUser } from './auth';
import { UserRole } from '@/models/User';

export interface RoleCheckOptions {
  allowedRoles: UserRole[];
  requireActive?: boolean;
  onUnauthorized?: (req: NextRequest, user?: AuthenticatedUser) => NextResponse;
}

export function requireRole(
  handler: (req: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>,
  options: RoleCheckOptions
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Verify authentication
      const user = await verifyToken(req);
      if (!user) {
        return createAuthResponse('Authentication required');
      }

      // Check if user is active (if required)
      if (options.requireActive !== false && !user.isActive) {
        if (options.onUnauthorized) {
          return options.onUnauthorized(req, user);
        }
        return NextResponse.json(
          {
            success: false,
            error: 'Account is deactivated',
          },
          { status: 403 }
        );
      }

      // Check role permissions
      if (!options.allowedRoles.includes(user.role)) {
        if (options.onUnauthorized) {
          return options.onUnauthorized(req, user);
        }
        return NextResponse.json(
          {
            success: false,
            error: 'Insufficient permissions',
            required: options.allowedRoles,
            current: user.role,
          },
          { status: 403 }
        );
      }

      // Update last login (optional - can be disabled for performance)
      await updateLastLogin(user.userId);

      // Pass the authenticated and authorized user to the handler
      return handler(req, user);

    } catch (error) {
      console.error('Role check error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Authorization check failed',
        },
        { status: 500 }
      );
    }
  };
}

// Helper function to update last login (optional)
async function updateLastLogin(userId: string) {
  try {
    const { default: connectDB } = await import('@/lib/mongodb');
    const { default: User } = await import('@/models/User');
    
    await connectDB();
    await User.findByIdAndUpdate(
      userId, 
      { lastLogin: new Date() },
      { new: true }
    );
  } catch (error) {
    // Silently fail - this is not critical
    console.warn('Failed to update last login:', error);
  }
}

// Common role check functions
export const requireUser = (handler: (req: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) =>
  requireRole(handler, { allowedRoles: ['user', 'admin', 'superadmin'] });

export const requireAdmin = (handler: (req: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) =>
  requireRole(handler, { allowedRoles: ['admin', 'superadmin'] });

export const requireSuperAdmin = (handler: (req: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) =>
  requireRole(handler, { allowedRoles: ['superadmin'] });

// Helper to check if user has admin privileges
export const hasAdminAccess = (user: AuthenticatedUser): boolean => {
  return user.role === 'admin' || user.role === 'superadmin';
};

export const hasSuperAdminAccess = (user: AuthenticatedUser): boolean => {
  return user.role === 'superadmin';
};