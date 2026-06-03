import { createContext, useState, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const response = await api.get(`/products${search ? `?search=${search}` : ''}`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = async (productData) => {
    try {
      await api.post('/products', productData);
      toast.success('Product added successfully');
      fetchProducts();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add product');
      return false;
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      await api.put(`/products/${id}`, productData);
      toast.success('Product updated successfully');
      fetchProducts();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update product');
      return false;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted successfully');
      fetchProducts();
      return true;
    } catch (error) {
      toast.error('Failed to delete product');
      return false;
    }
  };

  return (
    <ProductContext.Provider value={{ products, loading, fetchProducts, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
};
