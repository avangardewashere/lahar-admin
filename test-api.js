// Simple API testing script
const BASE_URL = 'http://localhost:3002';

async function testAPI() {
  console.log('🧪 Testing Task Management API System\n');

  // Test 1: Login as superadmin
  console.log('1. Testing login...');
  let loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'avelpanaligan@gmail.com',
      password: 'test123' // You'll need to use the correct password
    })
  });

  if (loginResponse.ok) {
    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', loginData.data.user);
    const token = loginData.data.token;

    // Test 2: Get user info
    console.log('\n2. Testing user info...');
    const userResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ User info:', userData.data.user);
    } else {
      console.log('❌ User info failed:', await userResponse.text());
    }

    // Test 3: Create a task
    console.log('\n3. Testing task creation...');
    const taskResponse = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test Task from API',
        description: 'This is a test task created via API',
        priority: 'high',
        category: 'Testing',
        tags: ['api', 'test'],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        estimatedHours: 2
      })
    });

    if (taskResponse.ok) {
      const taskData = await taskResponse.json();
      console.log('✅ Task created:', {
        id: taskData.data._id,
        title: taskData.data.title,
        status: taskData.data.status,
        priority: taskData.data.priority
      });

      // Test 4: Get tasks
      console.log('\n4. Testing task retrieval...');
      const tasksResponse = await fetch(`${BASE_URL}/api/tasks?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        console.log('✅ Tasks retrieved:', {
          count: tasksData.data.tasks.length,
          stats: tasksData.data.stats
        });
      } else {
        console.log('❌ Tasks retrieval failed:', await tasksResponse.text());
      }

      // Test 5: Test rate limiting API
      console.log('\n5. Testing rate limiting API...');
      const rateLimitResponse = await fetch(`${BASE_URL}/api/admin/rate-limiting`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (rateLimitResponse.ok) {
        const rateLimitData = await rateLimitResponse.json();
        console.log('✅ Rate limiting data:', {
          totalRequests: rateLimitData.data.analytics?.totalRequests || 0,
          totalBlocked: rateLimitData.data.analytics?.totalBlocked || 0,
          activeStatuses: rateLimitData.data.statuses?.length || 0
        });
      } else {
        console.log('❌ Rate limiting failed:', await rateLimitResponse.text());
      }

      // Test 6: Test user management API
      console.log('\n6. Testing user management API...');
      const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('✅ Users retrieved:', {
          totalUsers: usersData.data.stats.total,
          usersByRole: usersData.data.stats.byRole
        });
      } else {
        console.log('❌ Users retrieval failed:', await usersResponse.text());
      }

    } else {
      console.log('❌ Task creation failed:', await taskResponse.text());
    }

  } else {
    const errorData = await loginResponse.json();
    console.log('❌ Login failed:', errorData.error);
    console.log('Please update the password in this script and try again.');
  }

  console.log('\n🏁 API Testing Complete');
}

testAPI().catch(console.error);