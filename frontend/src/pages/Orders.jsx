import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { useCustomers } from '../context/CustomerContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';
import { 
  Plus, 
  Trash2, 
  Eye, 
  XOctagon, 
  PlusCircle, 
  MinusCircle, 
  AlertCircle, 
  Loader2,
  Calendar,
  DollarSign
} from 'lucide-react';

const Orders = () => {
  const { orders, loading, fetchOrders, createOrder, deleteOrder, updateOrderStatus } = useOrders();
  const { customers, fetchCustomers } = useCustomers();
  const { isManager } = useAuth();
  const navigate = useNavigate();

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Order creator state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);
  const [allCatalogProducts, setAllCatalogProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, [fetchOrders, fetchCustomers]);

  // Load all products for selector dropdown when modal opens
  const handleOpenAddOrder = async () => {
    setSelectedCustomerId('');
    setOrderItems([{ product_id: '', quantity: 1 }]);
    setApiError('');
    setCatalogLoading(true);
    setIsAddOpen(true);
    try {
      const res = await api.get('/api/products?limit=1000');
      setAllCatalogProducts(res.data.items);
    } catch (err) {
      console.error('Failed to load products for checkout list', err);
    } finally {
      setCatalogLoading(false);
    }
  };

  // Add a product item row
  const addOrderItemRow = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  };

  // Remove a product item row
  const removeOrderItemRow = (index) => {
    const updated = [...orderItems];
    updated.splice(index, 1);
    setOrderItems(updated);
  };

  // Handle value change inside row
  const handleRowChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;
    setOrderItems(updated);
  };

  // Calculate real-time totals
  const getTotals = () => {
    let grandTotal = 0;
    const itemsWithDetails = orderItems.map(item => {
      const prod = allCatalogProducts.find(p => p.id === parseInt(item.product_id));
      const price = prod ? prod.price : 0;
      const subtotal = price * item.quantity;
      grandTotal += subtotal;
      return { ...item, price, subtotal };
    });
    return { grandTotal, itemsWithDetails };
  };

  const { grandTotal, itemsWithDetails } = getTotals();

  // Submit checkout order
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    if (!selectedCustomerId) {
      setApiError('Please select a customer.');
      return;
    }

    // Filter empty selections
    const validItems = orderItems.filter(item => item.product_id !== '');
    if (validItems.length === 0) {
      setApiError('Please add at least one product to the order.');
      return;
    }

    // Check stock boundaries locally before calling backend
    for (const item of validItems) {
      const prod = allCatalogProducts.find(p => p.id === parseInt(item.product_id));
      if (prod && prod.quantity_in_stock < item.quantity) {
        setApiError(`Insufficient stock for product "${prod.product_name}". In Stock: ${prod.quantity_in_stock}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_id: parseInt(selectedCustomerId),
        items: validItems.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity)
        }))
      };
      await createOrder(payload);
      setIsAddOpen(false);
    } catch (err) {
      setApiError(err.cleanMessage || 'Failed to place order. Please review quantities.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order? This will restore product stock levels.")) {
      try {
        await updateOrderStatus(orderId, 'Cancelled');
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to cancel order.');
      }
    }
  };

  const openDelete = (order) => {
    setSelectedOrder(order);
    setApiError('');
    setIsDeleteOpen(true);
  };

  const onDeleteConfirm = async () => {
    setSubmitting(true);
    try {
      await deleteOrder(selectedOrder.id);
      setIsDeleteOpen(false);
    } catch (err) {
      setApiError(err.cleanMessage || 'Failed to delete order.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Completed') return 'bg-green-500/10 text-green-500';
    if (status === 'Cancelled') return 'bg-red-500/10 text-red-500';
    return 'bg-amber-500/10 text-amber-500';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium">Record and process customer transaction orders and checkout histories.</p>
        </div>
        <button 
          onClick={handleOpenAddOrder} 
          className="btn-primary h-10 px-4"
        >
          <Plus size={16} />
          <span>New Order</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="glass-panel rounded-xl shadow-sm overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-800/50">
            <thead>
              <tr className="bg-slate-55 dark:bg-slate-900/50">
                <th className="table-header">Order ID</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Date</th>
                <th className="table-header text-right">Total amount</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/30 dark:divide-slate-800/30">
              {loading ? (
                <tr>
                  <td colSpan="6" className="table-cell py-12 text-center">
                    <div className="flex items-center justify-center gap-2.5">
                      <Loader2 className="animate-spin text-primary-600 dark:text-primary-400" size={24} />
                      <span className="text-slate-400 font-semibold">Updating order ledgers...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="table-cell font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                      ORD-{order.id.toString().padStart(5, '0')}
                    </td>
                    <td className="table-cell">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{order.customer.full_name}</div>
                      <div className="text-xs text-slate-400">{order.customer.email}</div>
                    </td>
                    <td className="table-cell text-xs text-slate-405">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{new Date(order.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="table-cell text-right font-bold text-slate-800 dark:text-white">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="table-cell text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(order.order_status)}`}>
                        {order.order_status}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="p-1 text-slate-450 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="View Invoice Details"
                        >
                          <Eye size={16} />
                        </button>
                        {order.order_status !== 'Cancelled' && isManager && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="p-1 text-slate-450 hover:text-amber-500 transition-colors"
                            title="Cancel Order"
                          >
                            <XOctagon size={16} />
                          </button>
                        )}
                        {isManager && (
                          <button
                            onClick={() => openDelete(order)}
                            className="p-1 text-slate-450 hover:text-red-500 transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="table-cell text-center py-12 text-slate-400 font-semibold">
                    No orders placed yet. Click 'New Order' to process sales transactions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================= */}
      {/* MODAL: CREATE ORDER */}
      {/* ======================================= */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Process New Order Checkout">
        {catalogLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-primary-600" size={32} />
            <span className="text-sm font-semibold text-slate-400">Loading catalog indexes...</span>
          </div>
        ) : (
          <form onSubmit={handleCheckoutSubmit} className="space-y-5">
            {apiError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold flex gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Select Customer */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Select Buyer Customer</label>
              <select
                className="mt-1.5 form-input py-2.5"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                <option value="">-- Choose registered customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Order Items Rows */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider">Items Registry</label>
                <button
                  type="button"
                  onClick={addOrderItemRow}
                  className="text-xs font-bold text-primary-600 hover:text-primary-750 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
                >
                  <PlusCircle size={14} />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {orderItems.map((item, index) => {
                  const selectedProd = allCatalogProducts.find(p => p.id === parseInt(item.product_id));
                  const stockMax = selectedProd ? selectedProd.quantity_in_stock : 0;
                  
                  return (
                    <div key={index} className="flex gap-3 items-start border border-slate-100 dark:border-slate-800/60 p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                      
                      {/* Product Selector */}
                      <div className="flex-1 min-w-0">
                        <select
                          className="form-input mt-0 py-2"
                          value={item.product_id}
                          onChange={(e) => handleRowChange(index, 'product_id', e.target.value)}
                          required
                        >
                          <option value="">-- Select Product --</option>
                          {allCatalogProducts.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.product_name} - ${p.price.toFixed(2)} (Stock: {p.quantity_in_stock})
                            </option>
                          ))}
                        </select>
                        
                        {/* Show stock availability */}
                        {selectedProd && (
                          <div className="mt-1.5 flex items-center gap-2 text-xs font-medium">
                            <span className={stockMax === 0 ? 'text-red-500 font-bold' : stockMax <= 10 ? 'text-amber-500' : 'text-slate-450'}>
                              Stock Available: {stockMax} {stockMax === 0 ? '(Out of stock)' : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quantity input */}
                      <div className="w-24">
                        <input
                          type="number"
                          className="form-input mt-0 py-2 text-center"
                          value={item.quantity}
                          min="1"
                          max={stockMax || 1}
                          onChange={(e) => handleRowChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          required
                        />
                      </div>

                      {/* Subtotal preview */}
                      <div className="w-24 text-right pt-2.5 font-semibold text-sm">
                        ${selectedProd ? (selectedProd.price * item.quantity).toFixed(2) : '0.00'}
                      </div>

                      {/* Remove Button */}
                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOrderItemRow(index)}
                          className="p-2 text-slate-400 hover:text-red-500 pt-2"
                        >
                          <MinusCircle size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grand Total banner */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl flex justify-between items-center border border-slate-200/50 dark:border-slate-800/80">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Grand Total Amount</span>
              <div className="flex items-center text-xl font-black text-slate-800 dark:text-white">
                <DollarSign size={20} className="text-slate-450" />
                <span>{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setIsAddOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary min-w-[100px]">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Complete checkout'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ======================================= */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ======================================= */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Order Record">
        <div className="space-y-4">
          {apiError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold flex gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <p className="text-sm text-slate-650 dark:text-slate-350">
            Are you sure you want to permanently delete order record <span className="font-semibold text-slate-850 dark:text-white">ORD-{selectedOrder?.id.toString().padStart(5, '0')}</span>? 
            Deleting an order record will restore stock levels of its items if they were not already cancelled.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setIsDeleteOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button 
              type="button" 
              onClick={onDeleteConfirm} 
              disabled={submitting} 
              className="btn-danger min-w-[80px]"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Orders;
