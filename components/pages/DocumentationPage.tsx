'use client';

import { useState } from 'react';

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📖' },
    { id: 'authentication', name: 'Authentication', icon: '🔐' },
    { id: 'tasks', name: 'Task Management', icon: '📝' },
    { id: 'analytics', name: 'Analytics', icon: '📊' },
    { id: 'users', name: 'User Management', icon: '👥' },
    { id: 'examples', name: 'Code Examples', icon: '💻' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            API Documentation
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Complete guide for using the Lahar Task Management API
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">
        {activeTab === 'overview' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">API Overview</h3>
            <div className="prose max-w-none">
              <p className="text-gray-600 mb-4">
                The Lahar Task Management API is a comprehensive REST API that provides complete task management functionality 
                with advanced features like analytics, user management, and rate limiting.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-2">Base URL</h4>
                <code className="text-blue-700 bg-blue-100 px-2 py-1 rounded">https://your-domain.com/api</code>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Key Features</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>JWT-based authentication with role-based access control</li>
                  <li>Comprehensive task management with categories, tags, and subtasks</li>
                  <li>Advanced filtering, search, and pagination</li>
                  <li>Real-time analytics and productivity insights</li>
                  <li>Rate limiting and request monitoring</li>
                  <li>User management and administration</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Response Format</h4>
                <p className="text-green-700 mb-2">All API responses follow a consistent format:</p>
                <pre className="bg-green-100 text-green-800 p-3 rounded text-sm overflow-x-auto">
{`{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}

// Error responses:
{
  "success": false,
  "error": "Error message",
  "details": "Optional error details"
}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'authentication' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Authentication</h3>
            <div className="space-y-6">
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">1. User Registration</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 mb-3">Register a new user account:</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "registrationSource": "frontend"  // or "admin"
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">2. User Login</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 mb-3">Authenticate and receive JWT token:</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}

// Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">3. Using Authentication</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 mb-3">Include JWT token in request headers:</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`GET /api/tasks
Authorization: Bearer your_jwt_token_here
Content-Type: application/json`}
                  </pre>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">User Roles</h4>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li><strong>user</strong>: Can manage own tasks, basic API access</li>
                  <li><strong>admin</strong>: Can manage users, access admin dashboard, view system analytics</li>
                  <li><strong>superadmin</strong>: Full system access, can manage other admins</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Task Management API</h3>
            <div className="space-y-6">

              <div>
                <h4 className="font-medium text-gray-900 mb-2">List Tasks</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`GET /api/tasks?page=1&limit=20&status=todo&priority=high&search=project

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 20, max: 100)
- status: todo|in_progress|completed|cancelled
- priority: low|medium|high|urgent
- category: Filter by category name
- tags: Comma-separated tag names
- search: Full-text search across title/description
- dueDateFrom: Start date filter (ISO string)
- dueDateTo: End date filter (ISO string)
- sortBy: Field to sort by (default: createdAt)
- sortOrder: asc|desc (default: desc)`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Create Task</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`POST /api/tasks
Content-Type: application/json

{
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation",
  "status": "todo",
  "priority": "high",
  "category": "Documentation",
  "tags": ["api", "docs", "urgent"],
  "dueDate": "2025-08-15T00:00:00Z",
  "estimatedHours": 8,
  "subtasks": [
    { "title": "Write authentication section" },
    { "title": "Add code examples" }
  ],
  "assignedTo": ["user_id_1", "user_id_2"]
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Update Task</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`PUT /api/tasks/{task_id}
Content-Type: application/json

{
  "status": "in_progress",
  "actualHours": 3,
  "subtasks": [
    {
      "id": "existing_subtask_id",
      "title": "Updated subtask",
      "completed": true
    }
  ]
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Get Task Details</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`GET /api/tasks/{task_id}

// Returns full task details with populated user references`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Delete Task</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`DELETE /api/tasks/{task_id}

// Only task owner or admins can delete tasks`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics API</h3>
            <div className="space-y-6">

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Task Analytics</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`GET /api/tasks/analytics?period=30

Parameters:
- period: Number of days to analyze (default: 30)

Response includes:
- Task completion trends over time
- Priority and status distributions  
- Category performance metrics
- Tag usage statistics
- Time estimation accuracy
- Productivity insights by day/hour`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Categories</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`GET /api/tasks/categories?includeStats=true

// Returns list of categories with optional statistics`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`GET /api/tasks/tags?includeStats=true&search=project

// Returns list of tags with usage statistics and search support`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Management API (Admin Only)</h3>
            <div className="space-y-6">

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-900 mb-2">⚠️ Admin Access Required</h4>
                <p className="text-red-700">These endpoints require admin or superadmin role.</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">List Users</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`GET /api/admin/users?search=john&role=user&isActive=true

Query Parameters:
- search: Search by name or email
- role: Filter by user role
- isActive: Filter by active status
- page: Page number
- limit: Items per page`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Update User</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`PUT /api/admin/users
Content-Type: application/json

{
  "userId": "user_id_here",
  "action": "changeRole",  // or "toggleActive", "updateProfile"
  "data": {
    "role": "admin"  // or other update data
  }
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Delete User (SuperAdmin Only)</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`DELETE /api/admin/users?userId=user_id_here

// Only super admins can delete users`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Code Examples</h3>
            <div className="space-y-6">

              <div>
                <h4 className="font-medium text-gray-900 mb-2">JavaScript/Node.js</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`// Login and create a task
async function createTask() {
  // 1. Login
  const loginResponse = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'password123'
    })
  });
  
  const { data: { token } } = await loginResponse.json();
  
  // 2. Create task
  const taskResponse = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`
    },
    body: JSON.stringify({
      title: 'New Task',
      description: 'Task description',
      priority: 'high',
      category: 'Development',
      tags: ['api', 'backend'],
      dueDate: new Date(Date.now() + 7*24*60*60*1000).toISOString()
    })
  });
  
  const task = await taskResponse.json();
  console.log('Created task:', task.data);
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Python</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`import requests
from datetime import datetime, timedelta

# Login
login_response = requests.post('/api/auth/login', json={
    'email': 'user@example.com',
    'password': 'password123'
})
token = login_response.json()['data']['token']

# Get tasks with filtering
tasks_response = requests.get('/api/tasks', 
    headers={'Authorization': f'Bearer {token}'},
    params={
        'status': 'todo',
        'priority': 'high',
        'limit': 10
    }
)

tasks = tasks_response.json()['data']['tasks']
print(f"Found {len(tasks)} tasks")`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">cURL</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`# Login
curl -X POST /api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"password123"}'

# Create task
curl -X POST /api/tasks \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "title": "API Integration Task",
    "description": "Integrate with external API",
    "priority": "high",
    "category": "Integration",
    "estimatedHours": 4
  }'`}
                  </pre>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Rate Limiting</h4>
                <p className="text-blue-700 mb-2">All endpoints are rate-limited. Check response headers:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li><code>X-RateLimit-Limit</code>: Maximum requests allowed</li>
                  <li><code>X-RateLimit-Remaining</code>: Requests remaining in current window</li>
                  <li><code>X-RateLimit-Reset</code>: Unix timestamp when limit resets</li>
                  <li><code>Retry-After</code>: Seconds to wait if rate limited (429 error)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}