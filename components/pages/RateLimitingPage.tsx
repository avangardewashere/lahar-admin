'use client';

import { useState, useEffect } from 'react';

interface RateLimitConfig {
  endpoint: string;
  windowMs: number;
  maxRequests: number;
}

interface RequestLog {
  id: string;
  method: string;
  endpoint: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  timestamp: number;
  responseTime?: number;
  statusCode?: number;
  blocked: boolean;
  reason?: string;
}

interface RateLimitStatus {
  key: string;
  count: number;
  remaining: number;
  resetTime: number;
  endpoint?: string;
}

interface Analytics {
  requestsPerMinute: Array<{ timestamp: number; count: number; blocked: number }>;
  topEndpoints: Array<{ endpoint: string; count: number; blocked: number }>;
  topIPs: Array<{ ip: string; count: number; blocked: number }>;
  totalRequests: number;
  totalBlocked: number;
  averageResponseTime: number;
}

export default function RateLimitingPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [rateLimitStatuses, setRateLimitStatuses] = useState<RateLimitStatus[]>([]);
  const [recentLogs, setRecentLogs] = useState<RequestLog[]>([]);
  const [configs, setConfigs] = useState<RateLimitConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeWindow, setSelectedTimeWindow] = useState('1h');

  const timeWindows = {
    '15m': 900000,
    '1h': 3600000,
    '6h': 21600000,
    '24h': 86400000,
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [selectedTimeWindow]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/rate-limiting?timeWindow=${timeWindows[selectedTimeWindow as keyof typeof timeWindows]}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
        setRateLimitStatuses(data.statuses);
        setRecentLogs(data.recentLogs);
        setConfigs(data.configs);
      }
    } catch (error) {
      console.error('Failed to fetch rate limiting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
  };

  const getStatusColor = (remaining: number, max: number) => {
    const percentage = (remaining / max) * 100;
    if (percentage > 50) return 'text-green-600 bg-green-100';
    if (percentage > 20) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rate limiting dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Rate Limiting Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and analyze API request patterns and rate limiting
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <select
            value={selectedTimeWindow}
            onChange={(e) => setSelectedTimeWindow(e.target.value)}
            className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 bg-white text-gray-900"
          >
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
          </select>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">R</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Requests</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.totalRequests.toLocaleString()}</dd>
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
                    <span className="text-white text-sm font-medium">B</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Blocked Requests</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.totalBlocked.toLocaleString()}</dd>
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
                    <span className="text-white text-sm font-medium">T</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Response Time</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.averageResponseTime}ms</dd>
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
                    <span className="text-white text-sm font-medium">S</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.totalRequests > 0 
                        ? Math.round(((analytics.totalRequests - analytics.totalBlocked) / analytics.totalRequests) * 100)
                        : 100}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Rate Limit Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Active Rate Limits
          </h3>
          {rateLimitStatuses?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active rate limits</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Endpoint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remaining
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resets In
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rateLimitStatuses?.map((status, index) => {
                    const config = configs.find(c => c.endpoint === status.endpoint);
                    const maxRequests = config?.maxRequests || 100;
                    const resetIn = Math.max(0, status.resetTime - Date.now());
                    
                    return (
                      <tr key={status.key + index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {status.key.startsWith('user:') 
                            ? `User ${status.key.split(':')[1]}`
                            : `IP ${status.key.split(':')[1]}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {status.endpoint || 'Unknown'}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                              <div 
                                className={`h-2 rounded-full ${
                                  status.count / maxRequests > 0.8 ? 'bg-red-600' :
                                  status.count / maxRequests > 0.6 ? 'bg-yellow-600' : 'bg-green-600'
                                }`}
                                style={{ width: `${Math.min((status.count / maxRequests) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {status.count}/{maxRequests}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status.remaining, maxRequests)}`}>
                            {status.remaining} left
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDuration(resetIn)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Top Endpoints and IPs */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Endpoints */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Most Active Endpoints
              </h3>
              <div className="space-y-3">
                {analytics.topEndpoints?.slice(0, 5)?.map((endpoint, index) => (
                  <div key={endpoint.endpoint} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-4">#{index + 1}</span>
                      <code className="ml-3 bg-gray-100 px-2 py-1 rounded text-xs">
                        {endpoint.endpoint}
                      </code>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        {endpoint.count.toLocaleString()} requests
                      </span>
                      {endpoint.blocked > 0 && (
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                          {endpoint.blocked} blocked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top IPs */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Most Active IPs
              </h3>
              <div className="space-y-3">
                {analytics.topIPs?.slice(0, 5)?.map((ip, index) => (
                  <div key={ip.ip} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-4">#{index + 1}</span>
                      <span className="ml-3 text-sm font-mono text-gray-900">{ip.ip}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        {ip.count.toLocaleString()} requests
                      </span>
                      {ip.blocked > 0 && (
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                          {ip.blocked} blocked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Requests Log */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Requests
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentLogs?.slice(0, 10)?.map((log) => (
                  <tr key={log.id} className={log.blocked ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodColor(log.method)}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">{log.endpoint}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {log.ip}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.blocked ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Blocked
                        </span>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.statusCode && log.statusCode >= 200 && log.statusCode < 300
                            ? 'bg-green-100 text-green-800'
                            : log.statusCode && log.statusCode >= 400
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {log.statusCode}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.responseTime ? `${log.responseTime}ms` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Rate Limit Configuration */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Current Rate Limit Configuration
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Window
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max Requests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {configs?.map((config) => (
                  <tr key={config.endpoint}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <code className="bg-gray-100 px-2 py-1 rounded">{config.endpoint}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(config.windowMs)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {config.maxRequests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.round((config.maxRequests / config.windowMs) * 60000)} req/min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}