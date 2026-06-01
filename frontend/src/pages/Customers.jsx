import React, { useEffect, useState } from 'react';
import { useCustomers } from '../context/CustomerContext';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import Modal from '../components/Modal';
import { Plus, Trash2, Mail, Phone, User, AlertCircle, Loader2 } from 'lucide-react';

const Customers = () => {
  const { customers, loading, fetchCustomers, createCustomer, deleteCustomer } = useCustomers();
  const { isManager } = useAuth();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openDelete = (customer) => {
    setSelectedCustomer(customer);
    setApiError('');
    setIsDeleteOpen(true);
  };

  const onAddSubmit = async (data) => {
    setSubmitting(true);
    setApiError('');
    try {
      await createCustomer(data);
      reset();
      setIsAddOpen(false);
    } catch (err) {
      setApiError(err.cleanMessage || 'Failed to add customer. Email may already be registered.');
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteSubmit = async () => {
    setSubmitting(true);
    setApiError('');
    try {
      await deleteCustomer(selectedCustomer.id);
      setIsDeleteOpen(false);
    } catch (err) {
      setApiError(err.cleanMessage || 'Failed to delete customer. They may have active orders.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium">Directory of registered customer contacts and purchase profiles.</p>
        </div>
        {isManager && (
          <button 
            onClick={() => {
              reset();
              setApiError('');
              setIsAddOpen(true);
            }} 
            className="btn-primary h-10 px-4"
          >
            <Plus size={16} />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* Customers List Card */}
      <div className="glass-panel rounded-xl shadow-sm overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-800/50">
            <thead>
              <tr className="bg-slate-55 dark:bg-slate-900/50">
                <th className="table-header">Customer Name</th>
                <th className="table-header">Email Address</th>
                <th className="table-header">Phone Number</th>
                <th className="table-header">Registered On</th>
                {isManager && <th className="table-header text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/30 dark:divide-slate-800/30">
              {loading ? (
                <tr>
                  <td colSpan={isManager ? "5" : "4"} className="table-cell py-12 text-center">
                    <div className="flex items-center justify-center gap-2.5">
                      <Loader2 className="animate-spin text-primary-600 dark:text-primary-400" size={24} />
                      <span className="text-slate-400 font-semibold">Retrieving buyer logs...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="table-cell font-semibold text-slate-800 dark:text-slate-100">
                      {customer.full_name}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-350">
                        <Mail size={14} className="text-slate-400" />
                        <span>{customer.email}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      {customer.phone_number ? (
                        <div className="flex items-center gap-2 text-slate-650 dark:text-slate-350">
                          <Phone size={14} className="text-slate-400" />
                          <span>{customer.phone_number}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Not provided</span>
                      )}
                    </td>
                    <td className="table-cell text-xs text-slate-400">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                    {isManager && (
                      <td className="table-cell text-right">
                        <button
                          onClick={() => openDelete(customer)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isManager ? "5" : "4"} className="table-cell text-center py-12 text-slate-400 font-semibold">
                    No customers registered yet. Click 'Add Customer' to build your roster.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================= */}
      {/* MODAL: ADD CUSTOMER */}
      {/* ======================================= */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Customer Contact">
        <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-4">
          {apiError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold flex gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={16} />
              </div>
              <input
                type="text"
                placeholder="e.g. Alice Cooper"
                className="pl-10 form-input"
                {...register('full_name', { required: 'Name is required' })}
              />
            </div>
            {errors.full_name && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </div>
              <input
                type="email"
                placeholder="e.g. alice@gmail.com"
                className="pl-10 form-input"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number (Optional)</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone size={16} />
              </div>
              <input
                type="text"
                placeholder="e.g. +1 (555) 123-4567"
                className="pl-10 form-input"
                {...register('phone_number')}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setIsAddOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary min-w-[80px]">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Register'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================= */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ======================================= */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Remove Customer Account">
        <div className="space-y-4">
          {apiError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold flex gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <p className="text-sm text-slate-650 dark:text-slate-350">
            Are you sure you want to remove <span className="font-semibold text-slate-800 dark:text-white">"{selectedCustomer?.full_name}"</span>? 
            Deleting customer records will succeed only if they do not own existing invoice transactions.
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
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Remove'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Customers;
