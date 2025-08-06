'use client';

import { useState } from 'react';
import { ApiEndpoint, EndpointTestResult, EndpointConfig } from '@/types/api';

export default function ApiEndpointsPage() {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([
    // Task Management Endpoints
    {
      id: 'tasks-get',
      method: 'GET',
      path: '/api/tasks',
      description: 'List tasks with advanced filtering, search, and pagination',
      status: 'Active',
      requiresAuth: true,
      rateLimit: 100,
      lastTested: '2025-08-06T02:30:00Z',
      responseTime: 145,
      successRate: 99.2,
      requestCount: 15847,
      errorCount: 23,
      createdAt: '2025-08-06T00:00:00Z',
      updatedAt: '2025-08-06T02:00:00Z',
    },
    {
      id: 'tasks-post',
      method: 'POST',
      path: '/api/tasks',
      description: 'Create comprehensive tasks with categories, tags, subtasks, and assignments',
      status: 'Active',  
      requiresAuth: true,
      rateLimit: 100,
      lastTested: '2025-08-06T02:25:00Z',
      responseTime: 234,
      successRate: 98.7,
      requestCount: 8234,
      errorCount: 47,
      createdAt: '2025-08-06T00:00:00Z',
      updatedAt: '2025-08-06T02:00:00Z',
    },
    {
      id: 'tasks-detail-get',
      method: 'GET',
      path: '/api/tasks/[id]',
      description: 'Get specific task with full details and relationships',
      status: 'Active',
      requiresAuth: true,
      rateLimit: 200,
      lastTested: '2025-08-06T02:20:00Z',
      responseTime: 89,
      successRate: 99.8,
      requestCount: 12456,
      errorCount: 8,
      createdAt: '2025-08-06T00:00:00Z',
      updatedAt: '2025-08-06T02:00:00Z',
    },
    {
      id: 'tasks-detail-put',
      method: 'PUT',
      path: '/api/tasks/[id]',
      description: 'Update tasks with comprehensive validation and subtask management',
      status: 'Active',
      requiresAuth: true,
      rateLimit: 100,
      lastTested: '2025-08-06T02:15:00Z',
      responseTime: 187,
      successRate: 98.9,
      requestCount: 5678,
      errorCount: 34,
      createdAt: '2025-08-06T00:00:00Z',
      updatedAt: '2025-08-06T02:00:00Z',
    },
    {
      id: 'tasks-detail-delete',
      method: 'DELETE',
      path: '/api/tasks/[id]',
      description: 'Delete tasks with proper authorization and cleanup',
      status: 'Active',
      requiresAuth: true,
      rateLimit: 50,
      lastTested: '2025-08-06T02:10:00Z',
      responseTime: 95,
      successRate: 99.5,
      requestCount: 892,
      errorCount: 2,
      createdAt: '2025-08-06T00:00:00Z',
      updatedAt: '2025-08-06T02:00:00Z',
    },
    {
      id: 'tasks-analytics',
      method: 'GET',
      path: '/api/tasks/analytics',
      description: 'Comprehensive task analytics with trends and productivity insights',
      status: 'Active',
      requiresAuth: true,
      rateLimit: 30,
      lastTested: '2025-08-06T02:05:00Z',
      responseTime: 456,
      successRate: 99.1,
      requestCount: 2341,
      errorCount: 12,
      createdAt: '2025-08-06T00:00:00Z',
      updatedAt: '2025-08-06T02:00:00Z',
    },
    {
      id: 'tasks-categories',
      method: 'GET',
      path: '/api/tasks/categories',
      description: 'Get task categories with optional statistics and performance metrics',
      status: 'Active',
      requiresAuth: true,
      rateLimit: 100,
      lastTested: '2025-08-06T02:00:00Z',
      responseTime: 123,
      successRate: 99.7,
      requestCount: 1567,
      errorCount: 3,
      createdAt: '2025-08-06T00:00:00Z',
      updatedAt: '2025-08-06T02:00:00Z',
    },
    {
      id: 'tasks-tags',
      method: 'GET',
      path: '/api/tasks/tags',
      description: 'Get task tags with usage statistics and search capabilities',
      status: 'Active',
      requiresAuth: true,
      rateLimit: 100,
      lastTested: '2025-08-06T01:55:00Z',
      responseTime: 98,
      successRate: 99.8,
      requestCount: 1234,
      errorCount: 1,
      createdAt: '2025-08-06T00:00:00Z',
      updatedAt: '2025-08-06T02:00:00Z',
    },
    {
      id: 'auth-register',
      method: 'POST',
      path: '/api/auth/register',
      description: 'Register new user account',
      status: 'Active',
      requiresAuth: false,
      rateLimit: 10,
      lastTested: '2024-01-05T13:45:00Z',
      responseTime: 567,
      successRate: 95.3,
      requestCount: 2341,
      errorCount: 12,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-05T11:30:00Z',
    },
    {
      id: 'auth-login',
      method: 'POST',
      path: '/api/auth/login',
      description: 'Authenticate user and return JWT token',
      status: 'Active',
      requiresAuth: false,
      rateLimit: 20,
      lastTested: '2024-01-05T14:35:00Z',
      responseTime: 189,
      successRate: 94.8,
      requestCount: 12456,
      errorCount: 234,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-05T12:15:00Z',
    },
  ]);

  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResult, setTestResult] = useState<EndpointTestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Disabled': return 'bg-red-100 text-red-800';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint);
    setShowEditModal(true);
  };

  const handleTest = async (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint);
    setShowTestModal(true);
    setTesting(true);
    setTestResult(null);

    // Check if endpoint is disabled
    if (endpoint.status === 'Disabled') {
      const result: EndpointTestResult = {
        success: false,
        responseTime: 0,
        statusCode: 503,
        error: 'Endpoint is currently disabled. Enable it first to test.',
        timestamp: new Date().toISOString(),
      };
      setTestResult(result);
      setTesting(false);
      return;
    }

    // Check if endpoint is in maintenance
    if (endpoint.status === 'Maintenance') {
      const result: EndpointTestResult = {
        success: false,
        responseTime: 0,
        statusCode: 503,
        error: 'Endpoint is under maintenance. Please try again later.',
        timestamp: new Date().toISOString(),
      };
      setTestResult(result);
      setTesting(false);
      return;
    }

    try {
      const startTime = Date.now();
      
      // Simulate API test based on endpoint
      let response;
      let requestOptions: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // Add auth header if required
      if (endpoint.requiresAuth) {
        const token = localStorage.getItem('token');
        if (token) {
          requestOptions.headers = {
            ...requestOptions.headers,
            'Authorization': `Bearer ${token}`,
          };
        }
      }

      // Add sample data for POST requests
      if (endpoint.method === 'POST' && endpoint.path === '/api/tasks') {
        requestOptions.body = JSON.stringify({
          title: 'Test Task',
          description: 'API test task',
          priority: 'medium'
        });
      }

      response = await fetch(endpoint.path, requestOptions);
      const responseTime = Date.now() - startTime;
      const data = await response.json();

      const result: EndpointTestResult = {
        success: response.ok,
        responseTime,
        statusCode: response.status,
        response: data,
        timestamp: new Date().toISOString(),
      };

      // Update endpoint stats
      setEndpoints(prev => prev.map(ep => 
        ep.id === endpoint.id 
          ? { 
              ...ep, 
              lastTested: result.timestamp,
              responseTime: Math.round((ep.responseTime || 0) * 0.8 + responseTime * 0.2) // Moving average
            }
          : ep
      ));

      setTestResult(result);
    } catch (error) {
      const result: EndpointTestResult = {
        success: false,
        responseTime: 0,
        statusCode: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  };

  const handleToggleStatus = (endpoint: ApiEndpoint) => {
    const newStatus = endpoint.status === 'Active' ? 'Disabled' : 'Active';
    setEndpoints(prev => prev.map(ep => 
      ep.id === endpoint.id 
        ? { ...ep, status: newStatus, updatedAt: new Date().toISOString() }
        : ep
    ));
  };

  const handleSaveEdit = async (config: EndpointConfig) => {
    if (selectedEndpoint) {
      // Update the backend endpoint status
      try {
        await fetch('/api/admin/endpoint-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            method: selectedEndpoint.method,
            path: selectedEndpoint.path,
            status: config.status,
            rateLimit: config.rateLimit,
            requiresAuth: config.requiresAuth,
          }),
        });

        // Update local state
        setEndpoints(prev => prev.map(ep => 
          ep.id === selectedEndpoint.id 
            ? { 
                ...ep, 
                ...config,
                updatedAt: new Date().toISOString()
              }
            : ep
        ));
      } catch (error) {
        console.error('Failed to update endpoint status:', error);
        // Could show an error message to user here
      }
      
      setShowEditModal(false);
      setSelectedEndpoint(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            API Endpoints
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and configure your API endpoints (Read-only for admin users)
          </p>
        </div>
      </div>

      {/* Endpoints Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">E</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Endpoints</dt>
                  <dd className="text-lg font-medium text-gray-900">{endpoints.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">A</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {endpoints.filter(ep => ep.status === 'Active').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">R</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Response</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Math.round(endpoints.reduce((acc, ep) => acc + (ep.responseTime || 0), 0) / endpoints.length)}ms
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">E</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Errors</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {endpoints.reduce((acc, ep) => acc + (ep.errorCount || 0), 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {endpoints.map((endpoint) => (
                  <tr key={endpoint.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{endpoint.path}</code>
                      {endpoint.requiresAuth && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Auth Required
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{endpoint.description}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(endpoint.status)}`}>
                        {endpoint.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {endpoint.responseTime ? `${endpoint.responseTime}ms` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {endpoint.successRate ? `${endpoint.successRate}%` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(endpoint)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleTest(endpoint)}
                        className="text-yellow-600 hover:text-yellow-900 mr-4"
                      >
                        Test
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(endpoint)}
                        className={`${endpoint.status === 'Active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        {endpoint.status === 'Active' ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals - Rendered at the end to ensure proper z-index */}
      {showEditModal && selectedEndpoint && (
        <div>
          <EditEndpointModal
            endpoint={selectedEndpoint}
            onSave={handleSaveEdit}
            onClose={() => {
              setShowEditModal(false);
              setSelectedEndpoint(null);
            }}
          />
        </div>
      )}

      {showTestModal && selectedEndpoint && (
        <div>
          <TestEndpointModal
            endpoint={selectedEndpoint}
            testResult={testResult}
            testing={testing}
            onClose={() => {
              setShowTestModal(false);
              setSelectedEndpoint(null);
              setTestResult(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

// Edit Endpoint Modal Component
function EditEndpointModal({ 
  endpoint, 
  onSave, 
  onClose 
}: { 
  endpoint: ApiEndpoint;
  onSave: (config: EndpointConfig) => void;
  onClose: () => void;
}) {
  const [config, setConfig] = useState<EndpointConfig>({
    rateLimit: endpoint.rateLimit || 100,
    requiresAuth: endpoint.requiresAuth,
    description: endpoint.description,
    status: endpoint.status,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Edit Endpoint: {endpoint.method} {endpoint.path}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={config.description}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 bg-white"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Rate Limit (requests/minute)</label>
                  <input
                    type="number"
                    value={config.rateLimit}
                    onChange={(e) => setConfig({ ...config, rateLimit: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={config.status}
                    onChange={(e) => setConfig({ ...config, status: e.target.value as 'Active' | 'Disabled' | 'Maintenance' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Disabled">Disabled</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.requiresAuth}
                    onChange={(e) => setConfig({ ...config, requiresAuth: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Requires Authentication
                  </label>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Test Endpoint Modal Component
function TestEndpointModal({ 
  endpoint, 
  testResult, 
  testing, 
  onClose 
}: { 
  endpoint: ApiEndpoint;
  testResult: EndpointTestResult | null;
  testing: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full z-50">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Test Endpoint: {endpoint.method} {endpoint.path}
            </h3>
            
            {testing && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Testing endpoint...</span>
              </div>
            )}

            {testResult && (
              <div className="space-y-4">
                <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {testResult.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                    <span className="ml-3 text-sm">
                      Status: {testResult.statusCode} | Response Time: {testResult.responseTime}ms
                    </span>
                  </div>
                </div>

                {testResult.error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-red-800">Error:</h4>
                    <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">{testResult.error}</pre>
                  </div>
                )}

                {testResult.response && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-gray-800">Response:</h4>
                    <pre className="mt-2 text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(testResult.response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}