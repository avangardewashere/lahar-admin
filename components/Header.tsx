'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface NavigationItem {
  name: string;
  href: string;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: 'dashboard' },
  { name: 'Manage Users', href: 'manage-users' },
  { name: 'API Endpoints', href: 'api-endpoints' },
  { name: 'Rate Limiting', href: 'rate-limiting' },
  { name: 'Documentation', href: 'documentation' },
  { name: 'API Analytics', href: 'api-analytics' },
  { name: 'System Logs', href: 'system-logs' },
  { name: 'Settings', href: 'admin-settings' },
];

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const { user, logout, refreshUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => {
    if (!user) return false;
    
    // All authenticated users can access Dashboard
    if (item.href === 'dashboard') return true;
    
    // Only admins and superadmins can access admin features
    const adminOnlyPages = ['manage-users', 'api-endpoints', 'rate-limiting', 'documentation', 'api-analytics', 'system-logs', 'admin-settings'];
    if (adminOnlyPages.includes(item.href)) {
      return user.role === 'admin' || user.role === 'superadmin';
    }
    
    return true;
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = (href: string) => {
    onNavigate(href);
    setIsMobileMenuOpen(false); // Close mobile menu when clicking a nav item
  };

  return (
    <header className="relative bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Image
                src="/assets/image/Logo.png"
                alt="Lahar Admin Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">Lahar Admin</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {filteredNavigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentPage === item.href
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* User menu and mobile menu button */}
          <div className="flex items-center space-x-4">
            {/* User info - hidden on small screens */}
            <div className="hidden lg:flex items-center space-x-3">
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                <span className="text-xs text-gray-500">{user?.email}</span>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Logout button - desktop */}
            <button
              onClick={logout}
              className="hidden md:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              Logout
            </button>

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                // Close icon
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger icon
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - Absolute positioned overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 z-50 bg-white shadow-lg border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {filteredNavigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={`w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  currentPage === item.href
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {item.name}
              </button>
            ))}
            
            {/* Mobile user info and logout */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center px-3 py-2">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                  <span className="text-xs text-gray-500">{user?.email}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}