import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createAuthResponse } from '@/lib/auth';
import { updateEndpointStatus, getAllEndpointStatuses } from '@/lib/endpointStatus';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      return createAuthResponse();
    }

    const statuses = getAllEndpointStatuses();
    
    return NextResponse.json({
      success: true,
      data: statuses,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch endpoint statuses',
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

    const body = await request.json();
    const { method, path, status, rateLimit, requiresAuth } = body;
    
    if (!method || !path) {
      return NextResponse.json(
        {
          success: false,
          error: 'Method and path are required',
        },
        { status: 400 }
      );
    }

    // Update endpoint status
    updateEndpointStatus(method, path, {
      status: status || 'Active',
      rateLimit: rateLimit || 100,
      requiresAuth: requiresAuth !== undefined ? requiresAuth : true,
    });
    
    return NextResponse.json({
      success: true,
      message: `Endpoint ${method} ${path} status updated successfully`,
    });
  } catch (error) {
    console.error('Endpoint status update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update endpoint status',
      },
      { status: 500 }
    );
  }
}