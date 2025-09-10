import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useInvoices } from '../../hooks/useInvoices';
import { useCustomers } from '../../hooks/useCustomers';
import type { Invoice, InvoiceLineItem, InvoicePayment } from '../../types/database';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import PaymentModal from './PaymentModal';

interface InvoiceViewProps {
  invoiceId?: string;
  invoice?: Invoice;
  onClose?: () => void;
}

export default function InvoiceView({ invoiceId: propInvoiceId, invoice: propInvoice, onClose }: InvoiceViewProps) {
  const { id: paramInvoiceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoice, updateInvoiceStatus, deleteInvoice, getInvoiceLineItems, getInvoicePayments, loading } = useInvoices();
  const { customers } = useCustomers();

  const invoiceId = propInvoiceId || paramInvoiceId;
  
  const [invoice, setInvoice] = useState<Invoice | null>(propInvoice || null);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get customer data
  const customer = customers.find(c => c.id === invoice?.customer_id);

  // Load invoice data
  useEffect(() => {
    if (!invoiceId || propInvoice) return;

    const loadInvoice = async () => {
      try {
        const data = await getInvoice(invoiceId);
        setInvoice(data);
      } catch (error) {
        console.error('Error loading invoice:', error);
        toast.error('Failed to load invoice');
      }
    };

    loadInvoice();
  }, [invoiceId, propInvoice, getInvoice]);

  // Load line items and payments
  useEffect(() => {
    if (!invoiceId) return;

    const loadInvoiceData = async () => {
      try {
        const [lineItemsData, paymentsData] = await Promise.all([
          getInvoiceLineItems(invoiceId),
          getInvoicePayments(invoiceId)
        ]);
        
        setLineItems(lineItemsData);
        setPayments(paymentsData);
      } catch (error) {
        console.error('Error loading invoice data:', error);
      }
    };

    loadInvoiceData();
  }, [invoiceId, getInvoiceLineItems, getInvoicePayments]);

  // Calculate totals and balances
  const subtotal = invoice?.subtotal || 0;
  const taxAmount = invoice?.tax_amount || 0;
  const totalAmount = invoice?.total_amount || 0;
  const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balanceDue = totalAmount - paidAmount;

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'draft':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      case 'sent':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300`;
      case 'paid':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`;
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  };

  // Update invoice status
  const handleStatusUpdate = async (newStatus: string) => {
    if (!invoice) return;

    try {
      await updateInvoiceStatus(invoice.id, newStatus as any);
      setInvoice(prev => prev ? { ...prev, status: newStatus as any } : null);
      toast.success(`Invoice marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Delete invoice
  const handleDelete = async () => {
    if (!invoice) return;

    try {
      await deleteInvoice(invoice.id);
      toast.success('Invoice deleted successfully');
      if (onClose) {
        onClose();
      } else {
        navigate('/invoices');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };

  // Generate PDF (placeholder for future implementation)
  const handleGeneratePDF = () => {
    toast.success('PDF generation coming soon!');
  };

  // Send invoice (placeholder for future implementation)  
  const handleSendInvoice = () => {
    toast.success('Invoice sending coming soon!');
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/invoices');
    }
  };

  // Handle payment recording
  const handlePaymentRecorded = async () => {
    if (!invoiceId) return;
    
    // Reload payments and check if invoice is fully paid
    try {
      const paymentsData = await getInvoicePayments(invoiceId);
      setPayments(paymentsData);
      
      const newPaidAmount = paymentsData.reduce((sum, payment) => sum + payment.amount, 0);
      if (newPaidAmount >= totalAmount && invoice?.status !== 'paid') {
        await handleStatusUpdate('paid');
      }
    } catch (error) {
      console.error('Error reloading payment data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">Invoice not found</p>
          <p className="mt-1">The invoice you're looking for doesn't exist or has been deleted.</p>
        </div>
        <div className="mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {invoice.invoice_number}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {invoice.title}
              </p>
            </div>
            <span className={getStatusBadge(invoice.status)}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {invoice.status === 'draft' && (
              <>
                <button
                  onClick={handleSendInvoice}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                >
                  Send Invoice
                </button>
                <Link
                  to={`/invoices/${invoice.id}/edit`}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                >
                  Edit
                </Link>
              </>
            )}
            
            <button
              onClick={handleGeneratePDF}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              Download PDF
            </button>

            {/* More Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                title="Delete Invoice"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Invoice Header Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bill To */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Bill To
            </h3>
            {customer ? (
              <div className="text-gray-900 dark:text-white">
                <p className="font-medium">
                  {customer.company_name || `${customer.first_name} ${customer.last_name}`}
                </p>
                {customer.company_name && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {customer.first_name} {customer.last_name}
                  </p>
                )}
                {customer.email && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</p>
                )}
                {customer.phone && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{customer.phone}</p>
                )}
                {(customer.address_street || customer.address_city) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {customer.address_street && <p>{customer.address_street}</p>}
                    {(customer.address_city || customer.address_state || customer.address_zip) && (
                      <p>
                        {[customer.address_city, customer.address_state, customer.address_zip]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Customer not found</p>
            )}
          </div>

          {/* Invoice Details */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Invoice Details
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Invoice Number:</span>
                <span className="text-gray-900 dark:text-white font-medium">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Issue Date:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              {invoice.due_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Due Date:</span>
                  <span className="text-gray-900 dark:text-white">
                    {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className={getStatusBadge(invoice.status)}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {invoice.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Description
            </h3>
            <p className="text-gray-900 dark:text-white">{invoice.description}</p>
          </div>
        )}

        {/* Line Items */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Line Items
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3">
                      <div className="text-gray-900 dark:text-white font-medium">{item.title}</div>
                      {item.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
                      )}
                    </td>
                    <td className="text-right py-3 text-gray-900 dark:text-white">
                      {item.quantity}
                    </td>
                    <td className="text-right py-3 text-gray-900 dark:text-white">
                      ${item.unit_price.toFixed(2)}
                    </td>
                    <td className="text-right py-3 text-gray-900 dark:text-white font-medium">
                      ${item.total_amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                <span className="text-gray-900 dark:text-white">${taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span className="text-gray-900 dark:text-white">Total:</span>
              <span className="text-gray-900 dark:text-white">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Payment Summary
            </h3>
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500"
              >
                Record Payment
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ${totalAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                ${paidAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Balance Due</p>
              <p className={`text-lg font-semibold ${
                balanceDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                ${balanceDue.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <div className="flex justify-center mt-1">
                <span className={getStatusBadge(invoice.status)}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Actions */}
        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
          <div className="flex justify-end space-x-3">
            {invoice.status === 'draft' && (
              <button
                onClick={() => handleStatusUpdate('sent')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                Mark as Sent
              </button>
            )}
            {(invoice.status === 'sent' || invoice.status === 'overdue') && paidAmount >= totalAmount && (
              <button
                onClick={() => handleStatusUpdate('paid')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500"
              >
                Mark as Paid
              </button>
            )}
            <button
              onClick={() => handleStatusUpdate('cancelled')}
              className="px-4 py-2 border border-red-300 text-red-700 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-2 focus:ring-red-500"
            >
              Cancel Invoice
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete Invoice
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this invoice? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {invoice && (
        <PaymentModal
          invoice={invoice}
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}
    </div>
  );
}
