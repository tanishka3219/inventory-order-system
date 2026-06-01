import React, { useEffect, useState } from 'react';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import Modal from '../components/Modal';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Loader2
} from 'lucide-react';

const Products = () => {
  const { 
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
    deleteProduct
  } = useProducts();

  const { isManager } = useAuth();
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Search and filter state
  const [searchVal, setSearchVal] = useState(searchQuery);
  const [lowStockVal, setLowStockVal] = useState(lowStockFilter);

  // Forms setup
  const { register: registerAdd, handleSubmit: handleAddSubmit, reset: resetAdd, formState: { errors: addErrors } } = useForm();
  const { register: registerEdit, handleSubmit: handleEditSubmit, setValue: setEditValue, formState: { errors: editErrors } } = useForm();

  // Load products on mount or filter changes
  useEffect(() => {
    fetchProducts(1, searchVal, lowStockVal);
  }, [lowStockVal, fetchProducts]);

  // Handle manual search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts(1, searchVal, lowStockVal);
  };

  // Open Edit Modal and fill form values
  const openEdit = (product) => {
    setSelectedProduct(product);
    setEditValue('product_name', product.product_name);
    setEditValue('sku', product.sku);
    setEditValue('description', product.description || '');
    setEditValue('price', product.price);
    setEditValue('quantity_in_stock', product.quantity_in_stock);
    setApiError('');
    setIsEditOpen(true);
  };

  // Open Delete Modal
  const openDelete = (product) => {
    setSelectedProduct(product);
    setApiError('');
    setIsDeleteOpen(true);
  };

  // Submit Add Product
  const onAddSubmit = async (data) => {
    setSubmitting(true);
    setApiError('');
    try {
      await createProduct(data);
      resetAdd();
      setIsAddOpen(false);
    } catch (err) {
      setApiError(err.cleanMessage || 'Failed to add product. SKU may already exist.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Product
  const onEditSubmit = async (data) => {
    setSubmitting(true);
    setApiError('');
    try {
      await updateProduct(selectedProduct.id, data);
      setIsEditOpen(false);
    } catch (err) {
      setApiError(err.cleanMessage || 'Failed to update product.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delete Product
  const onDeleteSubmit = async () => {
    setSubmitting(true);
    setApiError('');
    try {
      await deleteProduct(selectedProduct.id);
      setIsDeleteOpen(false);
    } catch (err) {
      setApiError(err.cleanMessage || 'Failed to delete product. It may be linked to active orders.');
    } finally {
      setSubmitting(false);
    }
  };

  // Pagination Change page
  const changePage = (page) => {
    if (page >= 1 && page <= Math.ceil(total / limit)) {
      fetchProducts(page, searchVal, lowStockVal);
    }
  };

  // CSV Export action
  const exportToCSV = () => {
    const headers = ['ID', 'Product Name', 'SKU', 'Description', 'Price', 'Stock Quantity', 'Updated At'];
    const rows = products.map(p => [
      p.id,
      `"${p.product_name.replace(/"/g, '""')}"`,
      `"${p.sku.replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      p.price,
      p.quantity_in_stock,
      p.updated_at
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search & Filters */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative rounded-lg shadow-sm w-64">
            <input
              type="text"
              placeholder="Search by name or SKU..."
              className="form-input mt-0 pl-10 pr-4 py-2 border-slate-350 dark:border-slate-700 w-full"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
          </div>
          <button type="submit" className="btn-secondary py-2 px-3">
            Search
          </button>
          
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-505 cursor-pointer dark:text-slate-300 ml-2">
            <input
              type="checkbox"
              className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              checked={lowStockVal}
              onChange={(e) => setLowStockVal(e.target.checked)}
            />
            <span>Low Stock (≤10)</span>
          </label>
        </form>

        {/* Action buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button onClick={exportToCSV} className="btn-secondary h-10 px-3.5">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          {isManager && (
            <button 
              onClick={() => {
                resetAdd();
                setApiError('');
                setIsAddOpen(true);
              }} 
              className="btn-primary h-10 px-4"
            >
              <Plus size={16} />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Products Table container */}
      <div className="glass-panel rounded-xl shadow-sm overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-800/50">
            <thead>
              <tr className="bg-slate-55 dark:bg-slate-900/50">
                <th className="table-header">Product Details</th>
                <th className="table-header">SKU</th>
                <th className="table-header text-right">Price</th>
                <th className="table-header text-center">In Stock</th>
                <th className="table-header">Last Updated</th>
                {isManager && <th className="table-header text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/30 dark:divide-slate-800/30">
              {loading ? (
                <tr>
                  <td colSpan={isManager ? "6" : "5"} className="table-cell py-12 text-center">
                    <div className="flex items-center justify-center gap-2.5">
                      <Loader2 className="animate-spin text-primary-600 dark:text-primary-400" size={24} />
                      <span className="text-slate-400 font-semibold">Updating inventory index...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="table-cell">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{product.product_name}</div>
                      <div className="text-xs text-slate-400 max-w-xs truncate">{product.description || 'No description'}</div>
                    </td>
                    <td className="table-cell font-mono text-xs text-slate-500 dark:text-slate-400">
                      {product.sku}
                    </td>
                    <td className="table-cell text-right font-semibold">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="table-cell text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        product.quantity_in_stock <= 10 
                          ? 'bg-amber-500/10 text-amber-500' 
                          : 'bg-green-500/10 text-green-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          product.quantity_in_stock <= 10 ? 'bg-amber-500' : 'bg-green-500'
                        }`} />
                        {product.quantity_in_stock} units
                      </span>
                    </td>
                    <td className="table-cell text-xs text-slate-405">
                      {new Date(product.updated_at).toLocaleString()}
                    </td>
                    {isManager && (
                      <td className="table-cell text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => openEdit(product)}
                            className="p-1 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            title="Edit Product"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => openDelete(product)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isManager ? "6" : "5"} className="table-cell text-center py-12 text-slate-400 font-semibold">
                    No products matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Showing page {currentPage} of {totalPages} ({total} total results)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-slate-250 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-250 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================= */}
      {/* MODAL: ADD PRODUCT */}
      {/* ======================================= */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Catalog Item">
        <form onSubmit={handleAddSubmit(onAddSubmit)} className="space-y-4">
          {apiError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold flex gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Product Name</label>
            <input
              type="text"
              placeholder="e.g. Mechanical Keyboard"
              className="form-input mt-1.5"
              {...registerAdd('product_name', { required: 'Name is required' })}
            />
            {addErrors.product_name && <p className="text-xs text-red-500 mt-1 font-semibold">{addErrors.product_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">SKU</label>
              <input
                type="text"
                placeholder="e.g. KB-MECH-101"
                className="form-input mt-1.5"
                {...registerAdd('sku', { required: 'SKU is required' })}
              />
              {addErrors.sku && <p className="text-xs text-red-500 mt-1 font-semibold">{addErrors.sku.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Price ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="form-input mt-1.5"
                {...registerAdd('price', { 
                  required: 'Price is required',
                  min: { value: 0.00, message: 'Price cannot be negative' }
                })}
              />
              {addErrors.price && <p className="text-xs text-red-500 mt-1 font-semibold">{addErrors.price.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Initial Stock Quantity</label>
            <input
              type="number"
              placeholder="0"
              className="form-input mt-1.5"
              {...registerAdd('quantity_in_stock', { 
                required: 'Stock quantity is required',
                min: { value: 0, message: 'Stock cannot be negative' }
              })}
            />
            {addErrors.quantity_in_stock && <p className="text-xs text-red-500 mt-1 font-semibold">{addErrors.quantity_in_stock.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
            <textarea
              placeholder="Brief details about the product..."
              className="form-input mt-1.5 h-20 py-2 resize-none"
              {...registerAdd('description')}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setIsAddOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary min-w-[80px]">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================= */}
      {/* MODAL: EDIT PRODUCT */}
      {/* ======================================= */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Update Product details">
        <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
          {apiError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold flex gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Product Name</label>
            <input
              type="text"
              className="form-input mt-1.5"
              {...registerEdit('product_name', { required: 'Name is required' })}
            />
            {editErrors.product_name && <p className="text-xs text-red-500 mt-1 font-semibold">{editErrors.product_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">SKU</label>
              <input
                type="text"
                className="form-input mt-1.5 bg-slate-50 dark:bg-slate-850 cursor-not-allowed"
                disabled // keep SKU locked or restrict modifications
                {...registerEdit('sku')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Price ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-input mt-1.5"
                {...registerEdit('price', { 
                  required: 'Price is required',
                  min: { value: 0.00, message: 'Price cannot be negative' }
                })}
              />
              {editErrors.price && <p className="text-xs text-red-500 mt-1 font-semibold">{editErrors.price.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Quantity</label>
            <input
              type="number"
              className="form-input mt-1.5"
              {...registerEdit('quantity_in_stock', { 
                required: 'Stock quantity is required',
                min: { value: 0, message: 'Stock cannot be negative' }
              })}
            />
            {editErrors.quantity_in_stock && <p className="text-xs text-red-500 mt-1 font-semibold">{editErrors.quantity_in_stock.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
            <textarea
              className="form-input mt-1.5 h-20 py-2 resize-none"
              {...registerEdit('description')}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setIsEditOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary min-w-[80px]">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================= */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ======================================= */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          {apiError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold flex gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <p className="text-sm text-slate-600 dark:text-slate-350">
            Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-white">"{selectedProduct?.product_name}"</span>? 
            This action cannot be undone and will fail if referenced by active orders.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setIsDeleteOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button 
              type="button" 
              onClick={onDeleteSubmit} 
              disabled={submitting} 
              className="btn-danger min-w-[80px] h-10"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Products;
