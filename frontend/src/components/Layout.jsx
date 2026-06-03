import { useState, useEffect, useContext } from 'react';
import Sidebar from './Sidebar';
import { Moon, Sun, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Layout = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-dark-900 transition-colors">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full overflow-y-auto">
        <header className="h-16 border-b dark:border-dark-800 bg-white dark:bg-dark-900 flex items-center justify-end px-6 space-x-4 shrink-0 transition-colors">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Welcome, <span className="font-bold text-primary-600 dark:text-primary-500">{user?.username}</span> ({user?.role})
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-500 transition-colors"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={logout}
            className="flex items-center space-x-1 p-2 text-red-500 hover:text-red-700 transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </header>
        <main className="p-6 md:p-8 flex-1 text-gray-900 dark:text-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
