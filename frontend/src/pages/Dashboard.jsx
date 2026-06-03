import { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, Users, ShoppingCart, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  const chartData = [
    { name: 'Products', count: stats.total_products },
    { name: 'Customers', count: stats.total_customers },
    { name: 'Orders', count: stats.total_orders },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Package} title="Total Products" value={stats.total_products} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <StatCard icon={Users} title="Total Customers" value={stats.total_customers} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
        <StatCard icon={ShoppingCart} title="Total Orders" value={stats.total_orders} color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
        <StatCard icon={AlertTriangle} title="Low Stock Items" value={stats.low_stock_products.length} color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel dark:bg-dark-800/80 p-6 border-transparent dark:border-dark-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">System Overview</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1F2937', color: '#fff' }} />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel dark:bg-dark-800/80 p-6 border-transparent dark:border-dark-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Low Stock Alerts</h2>
          {stats.low_stock_products.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">All products are well stocked.</p>
          ) : (
            <div className="overflow-auto max-h-64">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-700">
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Product</th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.low_stock_products.map(product => (
                    <tr key={product.id} className="border-b border-gray-100 dark:border-dark-700 last:border-0">
                      <td className="py-3 font-medium text-gray-800 dark:text-gray-200">{product.product_name}</td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          {product.quantity_in_stock} left
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, color }) => (
  <div className="glass-panel dark:bg-dark-800/80 border-transparent dark:border-dark-700 p-6 flex items-center space-x-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
    </div>
  </div>
);

export default Dashboard;
