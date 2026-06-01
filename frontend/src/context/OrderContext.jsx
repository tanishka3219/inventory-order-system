import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/orders');
      setOrders(response.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error('Error fetching orders', err);
    }
  }, []);

  const getOrderDetails = async (id) => {
    try {
      const res = await api.get(`/api/orders/${id}`);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const createOrder = async (orderData) => {
    try {
      const res = await api.post('/api/orders', orderData);
      await fetchOrders();
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const deleteOrder = async (id) => {
    try {
      const res = await api.delete(`/api/orders/${id}`);
      await fetchOrders();
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const res = await api.put(`/api/orders/${id}/status`, { status });
      await fetchOrders();
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const value = {
    orders,
    loading,
    fetchOrders,
    getOrderDetails,
    createOrder,
    deleteOrder,
    updateOrderStatus,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
