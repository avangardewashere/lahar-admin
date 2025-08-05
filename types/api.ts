export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  status: 'Active' | 'Disabled' | 'Maintenance';
  requiresAuth: boolean;
  rateLimit?: number;
  lastTested?: string;
  responseTime?: number;
  successRate?: number;
  requestCount?: number;
  errorCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EndpointTestResult {
  success: boolean;
  responseTime: number;
  statusCode: number;
  response?: any;
  error?: string;
  timestamp: string;
}

export interface EndpointConfig {
  rateLimit: number;
  requiresAuth: boolean;
  description: string;
  status: 'Active' | 'Disabled' | 'Maintenance';
}