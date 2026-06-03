import { useContext, useEffect, useState, useMemo } from 'react';
import { OrderContext } from '../context/OrderContext';
import { ProductContext } from '../context/ProductContext';
import { CustomerContext } from '../context/CustomerContext';
import { Plus, Trash2, Download, Filter } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { downloadCSV } from '../utils/csv';

const Orders = () => {
  const { orders, loading, fetchOrders, addOrder, deleteOrder } = useContext(OrderContext);
  const { products, fetchProducts } = useContext(ProductContext);
  const { customers, fetchCustomers } = useContext(CustomerContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const { register, control, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      customer_id: '',
      items: [{ product_id: '', quantity: 1 }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchCustomers();
  }, [fetchOrders, fetchProducts, fetchCustomers]);

  const filteredOrders = useMemo(() => {
    if (!statusFilter) return orders;
    return orders.filter(order => order.order_status === statusFilter);
  }, [orders, statusFilter]);

  const handleExport = () => {
    const exportData = filteredOrders.map(order => {
      const customer = customers.find(c => c.id === order.customer_id);
      return {
        'Order ID': order.id,
        'Customer': customer ? customer.full_name : order.customer_id,
        'Date': new Date(order.created_at).toLocaleDateString(),
        'Total Amount': `$${order.total_amount.toFixed(2)}`,
        'Status': order.order_status
      };
    });
    downloadCSV(exportData, 'orders.csv');
  };

  const openModal = () => {
    reset({ customer_id: '', items: [{ product_id: '', quantity: 1 }] });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    const formattedData = {
      customer_id: parseInt(data.customer_id),
      items: data.items.map(item => ({
        product_id: parseInt(item.product_id),
        quantity: parseInt(item.quantity)
      }))
    };
    
    const success = await addOrder(formattedData);
    if (success) {
      setIsModalOpen(false);
      fetchProducts();
    }
  };

  const calculateTotal = () => {
    let total = 0;
    watchItems.forEach(item => {
      if (item.product_id && item.quantity) {
        const product = products.find(p => p.id === parseInt(item.product_id));
        if (product) {
          total += product.price * parseInt(item.quantity);
        }
      }
    });
    return total;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Orders</h1>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border dark:border-dark-700 dark:bg-dark-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          
          <button 
            onClick={handleExport}
            className="bg-white hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-200 border dark:border-dark-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download size={18} /> <span className="hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={openModal}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} /> <span className="hidden sm:inline">Create Order</span>
          </button>
        </div>
      </div>

      <div className="glass-panel dark:bg-dark-800/80 border-transparent dark:border-dark-700 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-dark-900 border-b dark:border-dark-700">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No orders found.</td></tr>
                ) : (
                  filteredOrders.map(order => {
                    const customer = customers.find(c => c.id === order.customer_id);
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-700/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">#{order.id}</td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{customer ? customer.full_name : `Customer ${order.customer_id}`}</td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-medium dark:text-gray-200">${order.total_amount.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.order_status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                            order.order_status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {order.order_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => { if(window.confirm('Delete this order?')) deleteOrder(order.id); }} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto border dark:border-dark-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Create New Order</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer</label>
                <select {...register('customer_id', { required: true })} className="w-full px-3 py-2 border dark:border-dark-700 dark:bg-dark-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                  <option value="">Select a customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                  ))}
                </select>
                {errors.customer_id && <span className="text-red-500 text-xs">Please select a customer</span>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Order Items</label>
                  <button type="button" onClick={() => append({ product_id: '', quantity: 1 })} className="text-sm text-primary-600 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-400 font-medium">
                    + Add Item
                  </button>
                </div>
                
                <div className="space-y-3">
                  {fields.map((field, index) => {
                    const selectedProductId = watchItems[index]?.product_id;
                    const selectedProduct = products.find(p => p.id === parseInt(selectedProductId));
                    
                    return (
                      <div key={field.id} className="flex gap-3 items-start bg-gray-50 dark:bg-dark-900/50 p-3 rounded-lg border dark:border-dark-700">
                        <div className="flex-grow">
                          <select 
                            {...register(`items.${index}.product_id`, { required: true })}
                            className="w-full px-3 py-2 border dark:border-dark-700 dark:bg-dark-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white mb-1"
                          >
                            <option value="">Select product...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id} disabled={p.quantity_in_stock === 0}>
                                {p.product_name} - ${p.price} ({p.quantity_in_stock} in stock)
                              </option>
                            ))}
                          </select>
                          {errors.items?.[index]?.product_id && <span className="text-red-500 text-xs block">Required</span>}
                        </div>
                        <div className="w-24">
                          <input 
                            type="number" 
                            {...register(`items.${index}.quantity`, { 
                              required: true, 
                              min: 1,
                              validate: value => {
                                if (!selectedProduct) return true;
                                return parseInt(value) <= selectedProduct.quantity_in_stock || 'Exceeds stock';
                              }
                            })}
                            className="w-full px-3 py-2 border dark:border-dark-700 dark:bg-dark-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" 
                            placeholder="Qty"
                          />
                          {errors.items?.[index]?.quantity && <span className="text-red-500 text-xs block">{errors.items[index].quantity.message || 'Invalid'}</span>}
                        </div>
                        {fields.length > 1 && (
                          <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-0.5">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center bg-gray-100 dark:bg-dark-700 p-4 rounded-lg">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Total Amount:</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">${calculateTotal().toFixed(2)}</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-dark-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium">Place Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
