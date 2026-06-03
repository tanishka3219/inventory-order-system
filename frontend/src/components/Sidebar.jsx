import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingCart } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Orders', path: '/orders', icon: ShoppingCart },
  ];

  return (
    <div className="w-64 bg-white dark:bg-dark-900 border-r dark:border-dark-800 h-full flex flex-col hidden md:flex transition-colors">
      <div className="h-16 flex items-center px-6 border-b dark:border-dark-800 shrink-0">
        <h1 className="text-xl font-bold text-primary-600 dark:text-primary-500">InventorySystem</h1>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
