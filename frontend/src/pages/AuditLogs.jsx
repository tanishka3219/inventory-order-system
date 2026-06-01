import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { History, Search, Loader2, Calendar, User as UserIcon } from 'lucide-react';

const AuditLogs = () => {
  const { isManager } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/api/audit-logs');
        setLogs(response.data);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    if (isManager) {
      fetchLogs();
    }
  }, [isManager]);

  // Route guarding in case of direct URL navigation
  if (!isManager) {
    return <Navigate to="/" replace />;
  }

  // Filter logs locally based on search keywords and actions type
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.details || '').toLowerCase().includes(searchVal.toLowerCase()) ||
      (log.target_table || '').toLowerCase().includes(searchVal.toLowerCase()) ||
      (log.user_name || '').toLowerCase().includes(searchVal.toLowerCase());
      
    const matchesAction = actionFilter ? log.action === actionFilter : true;
    
    return matchesSearch && matchesAction;
  });

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'CREATE_PRODUCT':
      case 'CREATE_CUSTOMER':
        return 'bg-blue-500/10 text-blue-500';
      case 'UPDATE_PRODUCT':
      case 'ORDER_STATUS_UPDATE':
        return 'bg-amber-500/10 text-amber-500';
      case 'DELETE_PRODUCT':
      case 'DELETE_CUSTOMER':
      case 'DELETE_ORDER':
        return 'bg-red-500/10 text-red-500';
      case 'ORDER_PLACE':
        return 'bg-green-500/10 text-green-500';
      case 'REGISTER':
        return 'bg-indigo-500/10 text-indigo-500';
      default:
        return 'bg-slate-550/10 text-slate-500';
    }
  };

  const getActionName = (action) => {
    return action.replace('_', ' ');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Search & Action filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative rounded-lg shadow-sm w-64">
            <input
              type="text"
              placeholder="Search logs details..."
              className="form-input mt-0 pl-10 pr-4 py-2 border-slate-350 dark:border-slate-700 w-full"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
          </div>

          <select
            className="form-input mt-0 py-2 w-48 text-sm"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">-- All Actions --</option>
            <option value="REGISTER">Registration</option>
            <option value="CREATE_PRODUCT">Create Product</option>
            <option value="UPDATE_PRODUCT">Update Product</option>
            <option value="DELETE_PRODUCT">Delete Product</option>
            <option value="CREATE_CUSTOMER">Create Customer</option>
            <option value="DELETE_CUSTOMER">Delete Customer</option>
            <option value="ORDER_PLACE">Order Placed</option>
            <option value="ORDER_STATUS_UPDATE">Order Status Update</option>
            <option value="DELETE_ORDER">Delete Order</option>
          </select>
        </div>
        
        <span className="text-xs font-semibold text-slate-450">
          Showing {filteredLogs.length} audit entries
        </span>
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-xl shadow-sm overflow-hidden border border-slate-205/50 dark:border-slate-800/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-800/50">
            <thead>
              <tr className="bg-slate-55 dark:bg-slate-900/50">
                <th className="table-header">Timestamp</th>
                <th className="table-header">Authorized User</th>
                <th className="table-header">Action Type</th>
                <th className="table-header">Affected Table</th>
                <th className="table-header">Details & Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/30 dark:divide-slate-800/30">
              {loading ? (
                <tr>
                  <td colSpan="5" className="table-cell py-12 text-center">
                    <div className="flex items-center justify-center gap-2.5">
                      <Loader2 className="animate-spin text-primary-600 dark:text-primary-400" size={24} />
                      <span className="text-slate-400 font-semibold">Loading system audit records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="table-cell text-xs text-slate-450 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                        <UserIcon size={14} className="text-slate-400" />
                        <span>{log.user_name}</span>
                        {log.user_id && (
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                            ID: {log.user_id}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold capitalize ${getActionBadgeColor(log.action)}`}>
                        {getActionName(log.action)}
                      </span>
                    </td>
                    <td className="table-cell font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {log.target_table}
                    </td>
                    <td className="table-cell text-xs max-w-sm break-words font-medium text-slate-600 dark:text-slate-350">
                      {log.details || 'No modifications logged'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="table-cell text-center py-12 text-slate-400 font-semibold">
                    No matching audit records located.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
