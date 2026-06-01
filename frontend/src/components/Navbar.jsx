import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Calendar, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useAuth();
  const location = useLocation();

  // Determine page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/products')) return 'Inventory Products';
    if (path.startsWith('/customers')) return 'Customer Database';
    if (path.startsWith('/orders')) return 'Order Registry';
    if (path.startsWith('/audit-logs')) return 'System Audit Trail';
    return 'StockVibe';
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
          {getPageTitle()}
        </h2>
      </div>

      {/* Right side items */}
      <div className="flex items-center gap-6">
        {/* Date display */}
        <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          <Calendar size={15} />
          <span>{formatDate()}</span>
        </div>

        {/* Vertical divider */}
        <div className="hidden md:block h-4 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Theme toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors duration-150"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Simple user badge */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                {user.full_name.split(' ')[0]}
              </span>
              <span className="text-[10px] font-bold text-primary-500 dark:text-primary-400 uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 flex items-center justify-center text-slate-600 dark:text-slate-350">
              <UserIcon size={16} />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
