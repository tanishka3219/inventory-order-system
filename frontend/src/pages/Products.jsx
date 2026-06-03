import { useContext, useEffect, useState } from 'react';
import { ProductContext } from '../context/ProductContext';
import { Search, Plus, Edit, Trash2, Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { downloadCSV } from '../utils/csv';

const Products = () => {
  const { products, loading, fetchProducts, addProduct, updateProduct, deleteProduct } = useContext(ProductContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(searchTerm);
  };

  const handleExport = () => {
    downloadCSV(products, 'products.csv');
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      reset(product);
    } else {
      setEditingProduct(null);
      reset({ product_name: '', sku: '', price: '', quantity_in_stock: '' });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    const success = editingProduct 
      ? await updateProduct(editingProduct.id, data)
      : await addProduct(data);
    
    if (success) setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Products</h1>
        
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
          <div className="relative flex-grow sm:w-64">
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-10 pr-4 py-2 border dark:border-dark-700 dark:bg-dark-800 dark:text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          <button type="submit" className="bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 dark:text-gray-200 dark:border-dark-700 text-gray-700 px-4 py-2 rounded-r-lg border-y border-r transition-colors">
            Search
          </button>
        </form>

        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExport}
            className="bg-white hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-200 border dark:border-dark-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
          >
            <Download size={18} /> Export
          </button>
          <button 
            onClick={() => openModal()}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
          >
            <Plus size={18} /> Add
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
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                {products.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No products found.</td></tr>
                ) : (
                  products.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{product.product_name}</div>
                        {product.description && <div className="text-sm text-gray-500 dark:text-gray-400">{product.description}</div>}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{product.sku}</td>
                      <td className="px-6 py-4 font-medium dark:text-gray-200">${product.price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.quantity_in_stock > 10 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {product.quantity_in_stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => openModal(product)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"><Edit size={18} /></button>
                        <button onClick={() => { if(window.confirm('Delete this product?')) deleteProduct(product.id); }} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-md p-6 border dark:border-dark-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                <input {...register('product_name', { required: true })} className="w-full px-3 py-2 border dark:border-dark-700 dark:bg-dark-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                {errors.product_name && <span className="text-red-500 text-xs">Required</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                <input {...register('sku', { required: true })} className="w-full px-3 py-2 border dark:border-dark-700 dark:bg-dark-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                {errors.sku && <span className="text-red-500 text-xs">Required</span>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price ($)</label>
                  <input type="number" step="0.01" {...register('price', { required: true, min: 0.01 })} className="w-full px-3 py-2 border dark:border-dark-700 dark:bg-dark-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  {errors.price && <span className="text-red-500 text-xs">Must be &gt; 0</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                  <input type="number" {...register('quantity_in_stock', { required: true, min: 0 })} className="w-full px-3 py-2 border dark:border-dark-700 dark:bg-dark-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  {errors.quantity_in_stock && <span className="text-red-500 text-xs">Must be &gt;= 0</span>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea {...register('description')} className="w-full px-3 py-2 border dark:border-dark-700 dark:bg-dark-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" rows="3"></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
