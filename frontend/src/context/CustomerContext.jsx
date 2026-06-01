import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/customers');
      setCustomers(response.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error('Error fetching customers', err);
    }
  }, []);

  const createCustomer = async (customerData) => {
    try {
      const res = await api.post('/api/customers', customerData);
      await fetchCustomers();
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const deleteCustomer = async (id) => {
    try {
      const res = await api.delete(`/api/customers/${id}`);
      await fetchCustomers();
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const value = {
    customers,
    loading,
    fetchCustomers,
    createCustomer,
    deleteCustomer,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = () => useContext(CustomerContext);
