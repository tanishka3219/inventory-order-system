import { createContext, useState, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

export const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, []);

  const addCustomer = async (customerData) => {
    try {
      await api.post('/customers', customerData);
      toast.success('Customer added successfully');
      fetchCustomers();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add customer');
      return false;
    }
  };

  const deleteCustomer = async (id) => {
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted successfully');
      fetchCustomers();
      return true;
    } catch (error) {
      toast.error('Failed to delete customer');
      return false;
    }
  };

  return (
    <CustomerContext.Provider value={{ customers, loading, fetchCustomers, addCustomer, deleteCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
};
