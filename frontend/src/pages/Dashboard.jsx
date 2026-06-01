import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DashboardCard from '../components/DashboardCard';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  AlertTriangle,
  Loader2,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';

const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/orders')
        ]);
        setStats(statsRes.data);
        setOrders(ordersRes.data);
      } catch (err) {
        console.error('Error fetching dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary-600 dark:text-primary-400" size={32} />
      </div>
    );
  }

  // 1. Prepare data for Inventory Distribution Chart (top 5 products by stock level)
  const inventoryData = stats?.low_stock_products?.slice(0, 5).map(p => ({
    name: p.product_name,
    stock: p.quantity_in_stock
  })) || [];

  // Fallback data if no low stock products or few products exist
  const finalInventoryData = inventoryData.length > 0 ? inventoryData : [
    { name: 'Demo Prod A', stock: 12 },
    { name: 'Demo Prod B', stock: 19 },
    { name: 'Demo Prod C', stock: 3 }
  ];

  // 2. Prepare data for Orders Summary (group orders by date, last 5 days or mock if empty)
  let orderSummaryData = [];
  if (orders.length > 0) {
    const grouped = {};
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      grouped[date] = (grouped[date] || 0) + order.total_amount;
    });
    orderSummaryData = Object.keys(grouped).map(date => ({
      date,
      revenue: parseFloat(grouped[date].toFixed(2))
    })).reverse(); // display oldest first
  } else {
    // Elegant fallback mock data to show how it populates when running for the first time
    orderSummaryData = [
      { date: 'May 28', revenue: 120 },
      { date: 'May 29', revenue: 340 },
      { date: 'May 30', revenue: 210 },
      { date: 'May 31', revenue: 540 },
      { date: 'Jun 01', revenue: 0 } // Current day placeholder
    ];
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Products"
          value={stats?.total_products || 0}
          icon={Package}
          description="Unique inventory items"
          colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <DashboardCard
          title="Total Customers"
          value={stats?.total_customers || 0}
          icon={Users}
          description="Registered buyers database"
          colorClass="bg-green-500/10 text-green-600 dark:text-green-400"
        />
        <DashboardCard
          title="Total Orders"
          value={stats?.total_orders || 0}
          icon={ShoppingCart}
          description="Processed transactions"
          colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        />
        <DashboardCard
          title="Low Stock Alerts"
          value={stats?.low_stock_products?.length || 0}
          icon={AlertTriangle}
          description="Items with stock <= 10"
          colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Orders Summary (Area Chart) */}
        <div className="glass-panel p-6 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-bold text-slate-805 dark:text-white">Order Revenue Trend</h4>
              <p className="text-xs text-slate-400 font-medium">Daily transaction volumes ($)</p>
            </div>
            <div className="p-2 bg-green-500/10 text-green-500 rounded-lg flex items-center gap-1 text-xs font-bold">
              <TrendingUp size={14} />
              <span>Live tracking</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={orderSummaryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" className="hidden dark:block" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#fff',
                    fontSize: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Stock Distribution (Bar Chart) */}
        <div className="glass-panel p-6 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-800/50">
          <div className="mb-6">
            <h4 className="text-base font-bold text-slate-805 dark:text-white">Critical Stock Alert Distribution</h4>
            <p className="text-xs text-slate-400 font-medium">Quantity levels of items requiring immediate restock</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={finalInventoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" className="hidden dark:block" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#fff',
                    fontSize: '12px'
                  }} 
                />
                <Bar dataKey="stock" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={28}>
                  {finalInventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts Table */}
      <div className="glass-panel rounded-xl shadow-sm overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-805 dark:text-white">Detailed Low Stock Alerts</h4>
            <p className="text-xs text-slate-400 font-medium">List of catalog items currently showing ten or fewer units remaining</p>
          </div>
          <Link 
            to="/products?filter=low"
            className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1.5"
          >
            <span>Manage Products</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-800/50">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50">
                <th className="table-header">Product Name</th>
                <th className="table-header">SKU</th>
                <th className="table-header">Unit Price</th>
                <th className="table-header">Remaining Stock</th>
                <th className="table-header text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/30 dark:divide-slate-800/30">
              {stats?.low_stock_products?.length > 0 ? (
                stats.low_stock_products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="table-cell font-semibold text-slate-800 dark:text-slate-200">
                      {product.product_name}
                    </td>
                    <td className="table-cell font-mono text-xs">
                      {product.sku}
                    </td>
                    <td className="table-cell">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="table-cell">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {product.quantity_in_stock} left
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <Link 
                        to="/products"
                        className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-750 dark:hover:text-primary-300"
                      >
                        Adjust Stock
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="table-cell text-center py-8 text-slate-400 font-medium">
                    🎉 Excellent! All products are fully stocked.
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

export default Dashboard;
