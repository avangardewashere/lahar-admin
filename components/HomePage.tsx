'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from './Header';
import DashboardPage from './pages/DashboardPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ApiEndpointsPage from './pages/ApiEndpointsPage';
import RateLimitingPage from './pages/RateLimitingPage';
import DocumentationPage from './pages/DocumentationPage';
import ApiAnalyticsPage from './pages/ApiAnalyticsPage';
import SystemLogsPage from './pages/SystemLogsPage';
import SettingsPage from './pages/SettingsPage';

export default function HomePage() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'manage-users':
        return <ManageUsersPage />;
      case 'api-endpoints':
        return <ApiEndpointsPage />;
      case 'rate-limiting':
        return <RateLimitingPage />;
      case 'documentation':
        return <DocumentationPage />;
      case 'api-analytics':
        return <ApiAnalyticsPage />;
      case 'system-logs':
        return <SystemLogsPage />;
      case 'admin-settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentPage()}
      </div>
    </div>
  );
}