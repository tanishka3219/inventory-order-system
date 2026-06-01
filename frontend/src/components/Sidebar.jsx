import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  History, 
  LogOut, 
  User as UserIcon,
  Layers
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, isManager } = useAuth();

  const links = [
    { to: '/', name: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff'] },
    { to: '/products', name: 'Products', icon: Package, roles: ['admin', 'manager', 'staff'] },
    { to: '/customers', name: 'Customers', icon: Users, roles: ['admin', 'manager', 'staff'] },
    { to: '/orders', name: 'Orders', icon: ShoppingCart, roles: ['admin', 'manager', 'staff'] },
    { to: '/audit-logs', name: 'Audit Logs', icon: History, roles: ['admin', 'manager'] },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 h-screen sticky top-0">
      {/* Brand logo header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="p-2 bg-primary-600 rounded-lg text-white">
          <Layers size={22} className="animate-pulse-slow" />
        </div>
        <div>
          <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-primary-300 bg-clip-text text-transparent">
            StockVibe
          </h1>
          <span className="text-[10px] text-primary-400 font-semibold tracking-wider uppercase">
            Enterprise Hub
          </span>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          // Check role permissions
          if (link.roles && user && !link.roles.includes(user.role)) {
            return null;
          }
          
          return (
            <NavLink
              key={link.name}
              to={link.to}
              className={({ isActive }) => `
                flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150
                ${isActive 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}
              `}
            >
              <link.icon size={18} />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer profile info & logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        {user && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30 flex items-center justify-center font-bold text-sm uppercase">
              {user.full_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-slate-200">
                {user.full_name}
              </p>
              <p className="text-xs text-primary-400 font-medium capitalize">
                {user.role}
              </p>
            </div>
          </div>
        )}
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-150"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
