import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required'
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.userId,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('User info fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user information'
      },
      { status: 500 }
    );
  }
}