
'use client'; // For potential client-side logic if expanded, though mostly for rendering

import type { Sale, SaleItem } from '@/types';
import { format } from 'date-fns';
import { Store } from 'lucide-react'; // Using Store icon as a placeholder logo

interface InvoiceTemplateProps {
  sale: Sale;
  storeDetails: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logoUrl?: string; // Optional actual logo URL
    terms: string;
    authorizedSignature?: string; // Placeholder for image or name
  };
}

export function InvoiceTemplate({ sale, storeDetails }: InvoiceTemplateProps) {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== 'number') return '₹0.00';
    return `₹${amount.toFixed(2)}`;
  };

  const dueDate = sale.saleDate; // Assuming due date is same as sale date for now
  const totalDue = sale.totalAmount;

  return (
    <div className="invoice-container bg-white p-8 font-sans text-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center space-x-3">
          {storeDetails.logoUrl ? (
            <img src={storeDetails.logoUrl} alt={`${storeDetails.name} Logo`} className="h-12 w-auto" data-ai-hint="store logo"/>
          ) : (
            <Store className="h-12 w-12 text-gray-700" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{storeDetails.name}</h1>
            <p className="text-gray-500">IDEA FOR INVOICE</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-semibold text-gray-800 uppercase">Invoice</h2>
          <p className="text-gray-600"><span className="font-semibold">Invoice No:</span> #{sale.id?.substring(0, 8).toUpperCase() || 'N/A'}</p>
          <p className="text-gray-600"><span className="font-semibold">Date:</span> {formatDate(sale.saleDate)}</p>
        </div>
      </div>

      {/* Bill To / Store Info */}
      <div className="flex justify-between mb-8">
        <div>
          <h3 className="font-semibold text-gray-700 mb-1">Invoice To</h3>
          <p className="text-gray-600">{sale.customerName}</p>
          {/* Add customer address if available in sale.customer object */}
          {/* <p className="text-gray-600">123 Customer Street, City, State, Zip</p> */}
          {/* <p className="text-gray-600">customer.email@example.com</p> */}
        </div>
        <div className="text-right">
          <p className="text-gray-600"><span className="font-semibold">Due Date:</span> {formatDate(dueDate)}</p>
          <p className="text-gray-600"><span className="font-semibold">Total Due:</span> {formatCurrency(totalDue)}</p>
          <p className="text-gray-600 mt-2">{storeDetails.address}</p>
          <p className="text-gray-600">{storeDetails.phone}</p>
          <p className="text-gray-600">{storeDetails.email}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8 table-auto">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="text-left p-3 font-semibold">Descriptions</th>
            <th className="text-right p-3 font-semibold">Price</th>
            <th className="text-center p-3 font-semibold">Quantity</th>
            <th className="text-right p-3 font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item: SaleItem, index: number) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="p-3 text-gray-700">{item.itemName}
                {item.description && <span className="block text-xs text-gray-500">{item.description}</span>}
              </td>
              <td className="text-right p-3 text-gray-700">{formatCurrency(item.priceUnit)}</td>
              <td className="text-center p-3 text-gray-700">{item.qty}</td>
              <td className="text-right p-3 text-gray-700">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="flex justify-end mb-8">
        <div className="w-full sm:w-64">
          <div className="flex justify-between py-1 text-gray-700">
            <span>Sub Total</span>
            <span>{formatCurrency(sale.subTotal)}</span>
          </div>
          {sale.totalItemDiscount > 0 && (
            <div className="flex justify-between py-1 text-gray-700">
              <span>Item Discounts</span>
              <span className="text-red-500">-{formatCurrency(sale.totalItemDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between py-1 text-gray-700">
            <span>Tax ({((sale.totalTax / (sale.subTotal - sale.totalItemDiscount)) * 100 || 0).toFixed(0)}%)</span>
            <span>{formatCurrency(sale.totalTax)}</span>
          </div>
          <div className="border-t border-gray-300 my-1"></div>
          <div className="flex justify-between py-1 text-gray-800 font-bold text-lg">
            <span>Grand Total</span>
            <span>{formatCurrency(sale.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      {sale.payments && sale.payments.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold text-gray-700 mb-2">Payment Method</h3>
          {sale.payments.map((p, i) => (
            <div key={i} className="text-gray-600">
              {p.mode}: {formatCurrency(p.amount)} {p.paymentDate ? `(on ${formatDate(p.paymentDate)})` : ''}
            </div>
          ))}
        </div>
      )}
       {sale.amountReceived < sale.totalAmount && sale.status !== 'Returned' && (
        <div className="mb-8 text-red-600 font-semibold">
            Balance Due: {formatCurrency(sale.totalAmount - sale.amountReceived)}
        </div>
      )}


      {/* Terms */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-700 mb-1">Terms</h3>
        <p className="text-gray-600 text-xs">{storeDetails.terms}</p>
      </div>

      {/* Signature */}
      {storeDetails.authorizedSignature && (
        <div className="text-right mb-8">
          <p className="text-gray-600 mb-1 italic">{storeDetails.authorizedSignature}</p>
          <p className="text-gray-600 border-t border-gray-400 pt-1 inline-block">Authorized Signature</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-6 border-t border-gray-300">
        <p className="text-gray-600 font-semibold mb-1">THANK YOU FOR YOUR BUSINESS</p>
        <p className="text-gray-500 text-xs">{storeDetails.website}</p>
      </div>
    </div>
  );
}

