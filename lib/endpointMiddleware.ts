import { NextRequest, NextResponse } from 'next/server';
import { getEndpointStatus, isEndpointEnabled } from './endpointStatus';

export function checkEndpointStatus(method: string, path: string) {
  if (!isEndpointEnabled(method, path)) {
    const status = getEndpointStatus(method, path);
    
    let message = 'Service temporarily unavailable';
    let statusCode = 503;
    
    switch (status.status) {
      case 'Disabled':
        message = 'This API endpoint has been disabled';
        statusCode = 503;
        break;
      case 'Maintenance':
        message = 'This API endpoint is under maintenance. Please try again later';
        statusCode = 503;
        break;
    }
    
    return NextResponse.json(
      {
        success: false,
        error: message,
        code: 'ENDPOINT_UNAVAILABLE',
        status: status.status,
      },
      { status: statusCode }
    );
  }
  
  return null; // Endpoint is active, proceed
}

// Helper function to wrap API routes with endpoint status checking
export function withEndpointCheck(
  handler: (req: NextRequest) => Promise<NextResponse>,
  method: string,
  path: string
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Check if endpoint is enabled
    const statusCheck = checkEndpointStatus(method, path);
    if (statusCheck) {
      return statusCheck;
    }
    
    // Endpoint is active, proceed with original handler
    const result = await handler(req);
    return result;
  };
}