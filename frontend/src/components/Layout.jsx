import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Loader2 } from 'lucide-react';

const Layout = () => {
  const { token, loading } = useAuth();
  const location = useLocation();

  // If auth is loading, render a beautiful full-screen loader
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4 transition-colors duration-200">
        <Loader2 className="animate-spin text-primary-600 dark:text-primary-400" size={40} />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase animate-pulse">
          Synchronizing session...
        </p>
      </div>
    );
  }

  // Route protection redirect to login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Permanent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        
        {/* Dynamic sub-routes container */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
