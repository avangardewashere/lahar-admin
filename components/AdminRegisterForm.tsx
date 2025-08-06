'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRegisterFormProps {
  onSwitchToLogin: () => void;
}

export default function AdminRegisterForm({ onSwitchToLogin }: AdminRegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresInitialSetup, setRequiresInitialSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  const { register } = useAuth();

  useEffect(() => {
    // Check if this is initial setup
    checkInitialSetup();
  }, []);

  const checkInitialSetup = async () => {
    try {
      const response = await fetch('/api/auth/admin/register');
      const data = await response.json();
      
      if (data.success) {
        setRequiresInitialSetup(data.data.requiresInitialSetup);
      }
    } catch (error) {
      console.error('Failed to check setup status:', error);
    } finally {
      setCheckingSetup(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (!inviteCode.trim()) {
      setError('Admin invite code is required');
      setLoading(false);
      return;
    }

    try {
      let success = false;

      if (requiresInitialSetup) {
        // Use public admin registration for initial setup
        const response = await fetch('/api/auth/admin/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            name,
            inviteCode: inviteCode.trim(),
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          const { user: userData, token: userToken } = data.data;
          localStorage.setItem('token', userToken);
          localStorage.setItem('user', JSON.stringify(userData));
          success = true;
          // Force page reload to update auth context
          window.location.reload();
        } else {
          setError(data.error || 'Admin registration failed');
        }
      } else {
        // Use regular registration with admin source
        success = await register(email, password, name, 'admin', inviteCode.trim());
        if (!success) {
          setError('Admin registration failed. Please check your invite code.');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
    }

    setLoading(false);
  };

  if (checkingSetup) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking system setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
        {requiresInitialSetup ? 'Initial Admin Setup' : 'Admin Registration'}
      </h2>
      
      {requiresInitialSetup && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded text-sm">
          <strong>Initial Setup:</strong> This appears to be the first admin account. 
          Use your admin or super admin invite code to set up the system.
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="Enter your admin email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="Enter your password (min 6 characters)"
          />
        </div>

        <div>
          <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
            Admin Invite Code
          </label>
          <input
            type="password"
            id="inviteCode"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="Enter admin invite code"
          />
          <p className="mt-1 text-xs text-gray-500">
            Contact your system administrator for the admin invite code
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
        >
          {loading ? 'Creating admin account...' : 'Register as Admin'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an admin account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  );
}