// Simple in-memory store for endpoint status
// In production, this would be stored in a database or Redis

interface EndpointStatus {
  [key: string]: {
    status: 'Active' | 'Disabled' | 'Maintenance';
    rateLimit: number;
    requiresAuth: boolean;
  };
}

let endpointStatusStore: EndpointStatus = {
  'GET:/api/tasks': {
    status: 'Active',
    rateLimit: 100,
    requiresAuth: true,
  },
  'POST:/api/tasks': {
    status: 'Active',
    rateLimit: 50,
    requiresAuth: true,
  },
  'POST:/api/auth/register': {
    status: 'Active',
    rateLimit: 10,
    requiresAuth: false,
  },
  'POST:/api/auth/login': {
    status: 'Active',
    rateLimit: 20,
    requiresAuth: false,
  },
};

export function getEndpointStatus(method: string, path: string) {
  const key = `${method}:${path}`;
  return endpointStatusStore[key] || { status: 'Active', rateLimit: 100, requiresAuth: true };
}

export function updateEndpointStatus(method: string, path: string, status: Partial<EndpointStatus[string]>) {
  const key = `${method}:${path}`;
  endpointStatusStore[key] = { ...endpointStatusStore[key], ...status };
}

export function isEndpointEnabled(method: string, path: string): boolean {
  const status = getEndpointStatus(method, path);
  return status.status === 'Active';
}

export function getAllEndpointStatuses(): EndpointStatus {
  return { ...endpointStatusStore };
}