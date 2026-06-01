import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [limit] = useState(8); // items per page
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const fetchProducts = useCallback(async (page = 1, search = '', lowStock = false) => {
    setLoading(true);
    setCurrentPage(page);
    setSearchQuery(search);
    setLowStockFilter(lowStock);
    
    const skip = (page - 1) * limit;
    try {
      const response = await api.get('/api/products', {
        params: {
          skip,
          limit,
          search: search || undefined,
          low_stock: lowStock,
        },
      });
      setProducts(response.data.items);
      setTotal(response.data.total);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error('Error fetching products', err);
    }
  }, [limit]);

  const createProduct = async (productData) => {
    try {
      const res = await api.post('/api/products', productData);
      // Refresh current page
      await fetchProducts(currentPage, searchQuery, lowStockFilter);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const res = await api.put(`/api/products/${id}`, productData);
      await fetchProducts(currentPage, searchQuery, lowStockFilter);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    try {
      const res = await api.delete(`/api/products/${id}`);
      // If we delete the last item on the page, move back a page
      const nextTotal = total - 1;
      const maxPage = Math.max(1, Math.ceil(nextTotal / limit));
      const targetPage = currentPage > maxPage ? maxPage : currentPage;
      await fetchProducts(targetPage, searchQuery, lowStockFilter);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const value = {
    products,
    total,
    loading,
    limit,
    currentPage,
    searchQuery,
    lowStockFilter,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => useContext(ProductContext);
