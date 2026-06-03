import { useContext, useEffect, useState } from 'react';
import { CustomerContext } from '../context/CustomerContext';
import { Plus, Trash2, Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { downloadCSV } from '../utils/csv';

const Customers = () => {
  const { customers, loading, fetchCustomers, addCustomer, deleteCustomer } = useContext(CustomerContext);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleExport = () => {
    downloadCSV(customers, 'customers.csv');
  };

  const openModal = () => {
    reset({ full_name: '', email: '', phone_number: '' });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    const success = await addCustomer(data);
    if (success) setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Customers</h1>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="bg-white hover:bg-gray-50 dark:bg-dark-800 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-200 border dark:border-dark-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download size={18} /> Export
          </button>
          <button 
            onClick={openModal}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
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
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                {customers.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No customers found.</td></tr>
                ) : (
                  customers.map(customer => (
                    <tr key={customer.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-700/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{customer.full_name}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{customer.email}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{customer.phone_number || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => { if(window.confirm('Delete this customer?')) deleteCustomer(customer.id); }} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"><Trash2 size={18} /></button>
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
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Add New Customer</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input {...register('full_name', { required: true })} className="w-full px-3 py-2 border dark:border-dark-700 dark:bg-dark-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                {errors.full_name && <span className="text-red-500 text-xs">Required</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" {...register('email', { required: true })} className="w-full px-3 py-2 border dark:border-dark-700 dark:bg-dark-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                {errors.email && <span className="text-red-500 text-xs">Required valid email</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input {...register('phone_number')} className="w-full px-3 py-2 border dark:border-dark-700 dark:bg-dark-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
