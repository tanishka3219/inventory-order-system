import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { Loader2, ArrowLeft, Printer, ShoppingBag, ShieldAlert } from 'lucide-react';

const OrderDetail = () => {
  const { id } = useParams();
  const { getOrderDetails } = useOrders();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getOrderDetails(id);
        setOrder(data);
      } catch (err) {
        setError('Order not found or access denied.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, getOrderDetails]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary-600 dark:text-primary-400" size={32} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="glass-panel p-8 text-center rounded-xl space-y-4 max-w-md mx-auto">
        <div className="inline-flex p-3 bg-red-500/10 text-red-500 rounded-full">
          <ShieldAlert size={28} />
        </div>
        <h3 className="text-lg font-bold text-slate-805 dark:text-white">Failed to retrieve order</h3>
        <p className="text-xs text-slate-550 dark:text-slate-400">{error || 'Unknown error occurred.'}</p>
        <button onClick={() => navigate('/orders')} className="btn-secondary w-full">
          Back to Registry
        </button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    if (status === 'Completed') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (status === 'Cancelled') return 'bg-red-500/10 text-red-500 border-red-500/20';
    return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Invoice Actions header (Hidden during print) */}
      <div className="flex items-center justify-between print:hidden">
        <button 
          onClick={() => navigate('/orders')}
          className="btn-secondary h-10 px-3.5"
        >
          <ArrowLeft size={16} />
          <span>Back to Registry</span>
        </button>
        <button 
          onClick={() => window.print()}
          className="btn-primary h-10 px-4"
        >
          <Printer size={16} />
          <span>Print Invoice</span>
        </button>
      </div>

      {/* Invoice Card Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl shadow-sm p-8 max-w-4xl mx-auto print:border-0 print:shadow-none print:p-0">
        
        {/* Brand Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary-600 rounded-lg text-white">
                <ShoppingBag size={18} />
              </div>
              <span className="font-extrabold text-lg text-slate-850 dark:text-white">StockVibe Invoice</span>
            </div>
            <p className="text-xs text-slate-400">
              100 Innovation Way, Suite 400<br />
              Boston, MA 02110<br />
              billing@stockvibe.com
            </p>
          </div>
          
          <div className="text-left sm:text-right space-y-1.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">INVOICE</h3>
            <div className="text-xs text-slate-450 font-mono">
              <p>Invoice ID: <span className="font-semibold text-slate-700 dark:text-slate-300">ORD-{order.id.toString().padStart(5, '0')}</span></p>
              <p>Date: <span className="font-semibold text-slate-700 dark:text-slate-300">{new Date(order.created_at).toLocaleDateString()}</span></p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(order.order_status)}`}>
              {order.order_status}
            </span>
          </div>
        </div>

        {/* Billing Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Billed To:</h4>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-205">{order.customer.full_name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{order.customer.email}</p>
              {order.customer.phone_number && (
                <p className="text-xs text-slate-500 dark:text-slate-455">{order.customer.phone_number}</p>
              )}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Payment Terms:</h4>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Due on Receipt (Net 0)</p>
            <p className="text-xs text-slate-400">Paid via Credit/Debit Card</p>
          </div>
        </div>

        {/* Invoice Items Table */}
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 py-6">
          <thead>
            <tr>
              <th className="py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Item Details</th>
              <th className="py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">SKU</th>
              <th className="py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Unit Price</th>
              <th className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity</th>
              <th className="py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {order.order_items.map((item) => (
              <tr key={item.id}>
                <td className="py-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {item.product_name || 'Removed Catalog Product'}
                </td>
                <td className="py-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                  {item.sku || 'N/A'}
                </td>
                <td className="py-4 text-sm text-right">
                  ${item.unit_price.toFixed(2)}
                </td>
                <td className="py-4 text-sm text-center">
                  {item.quantity}
                </td>
                <td className="py-4 text-sm text-right font-bold">
                  ${item.subtotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Subtotals & Summary Block */}
        <div className="flex justify-end pt-8 border-t border-slate-200 dark:border-slate-800 mt-6">
          <div className="w-full sm:w-64 space-y-2 text-sm">
            <div className="flex justify-between text-slate-500 dark:text-slate-405">
              <span>Subtotal:</span>
              <span>${order.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-405">
              <span>Tax (0.0%):</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-405 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span>Shipping:</span>
              <span>FREE</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-800 dark:text-white pt-1">
              <span>Total Balance Due:</span>
              <span>${order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Print Invoice styles media rules */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body {
              background-color: white !important;
              color: black !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:border-0 {
              border: 0 !important;
            }
            .print\\:shadow-none {
              box-shadow: none !important;
            }
            .print\\:p-0 {
              padding: 0 !important;
            }
            aside, header {
              display: none !important;
            }
            main {
              padding: 0 !important;
              overflow: visible !important;
            }
          }
        `}} />
      </div>
    </div>
  );
};

export default OrderDetail;
