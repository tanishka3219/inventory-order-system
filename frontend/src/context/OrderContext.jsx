import { createContext, useState, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const addOrder = async (orderData) => {
    try {
      await api.post('/orders', orderData);
      toast.success('Order placed successfully');
      fetchOrders();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to place order');
      return false;
    }
  };

  const deleteOrder = async (id) => {
    try {
      await api.delete(`/orders/${id}`);
      toast.success('Order cancelled successfully');
      fetchOrders();
      return true;
    } catch (error) {
      toast.error('Failed to cancel order');
      return false;
    }
  };

  return (
    <OrderContext.Provider value={{ orders, loading, fetchOrders, addOrder, deleteOrder }}>
      {children}
    </OrderContext.Provider>
  );
};
