import React from 'react';

const DashboardCard = ({ title, value, icon: Icon, description, trend, colorClass = "bg-primary-500/10 text-primary-600 dark:text-primary-400" }) => {
  return (
    <div className="glass-panel rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          {value}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {description}
          </p>
        )}
      </div>

      <div className={`p-4 rounded-xl ${colorClass} flex items-center justify-center`}>
        <Icon size={24} />
      </div>
    </div>
  );
};

export default DashboardCard;
