
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
    tagline?: string; // Optional tagline like "IDEA FOR INVOICE"
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

  const dueDate = sale.saleDate; 
  const totalDue = sale.totalAmount;

  return (
    <div className="invoice-container bg-white p-6 sm:p-8 font-sans text-gray-700 text-sm">
      {/* Header Section */}
      <div className="flex justify-between items-start pb-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {storeDetails.logoUrl ? (
            <img src={storeDetails.logoUrl} alt={`${storeDetails.name} Logo`} className="h-12 w-auto max-h-16" data-ai-hint="store logo"/>
          ) : (
            <Store className="h-10 w-10 text-gray-600" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{storeDetails.name}</h1>
            {storeDetails.tagline && <p className="text-xs text-gray-500 uppercase tracking-wider">{storeDetails.tagline}</p>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-semibold text-gray-800 uppercase">Invoice</h2>
          <p className="text-gray-600 mt-1"><span className="font-medium text-gray-700">Invoice No:</span> #{sale.id?.substring(0, 8).toUpperCase() || 'N/A'}</p>
          <p className="text-gray-600"><span className="font-medium text-gray-700">Date:</span> {formatDate(sale.saleDate)}</p>
        </div>
      </div>

      {/* Bill To / Store Info Section */}
      <div className="flex justify-between py-6 border-b border-gray-200">
        <div className="w-2/5 pr-4">
          <h3 className="font-semibold text-gray-700 mb-1">Invoice To</h3>
          <p className="text-gray-600 font-medium">{sale.customerName}</p>
          {/* Customer Address - to be added if available */}
          {/* <p className="text-gray-500 text-xs">123 Customer Address Ln, Client City, ST 54321</p> */}
          {/* <p className="text-gray-500 text-xs">customer@email.com</p> */}
        </div>
        <div className="w-3/5 text-right pl-4">
          <p className="text-gray-600"><span className="font-medium text-gray-700">Due Date:</span> {formatDate(dueDate)}</p>
          <p className="text-gray-600 font-semibold text-lg"><span className="font-medium text-gray-700">Total Due:</span> {formatCurrency(totalDue)}</p>
          <div className="mt-2 text-xs text-gray-500">
            <p>{storeDetails.address}</p>
            <p>{storeDetails.phone} | {storeDetails.email}</p>
          </div>
        </div>
      </div>

      {/* Items Table Section */}
      <div className="py-6">
        <table className="w-full table-auto">
          <thead className="bg-gray-100 print:bg-gray-100">
            <tr>
              <th className="text-left p-2 font-semibold text-gray-700 text-xs uppercase tracking-wider">Description</th>
              <th className="text-right p-2 font-semibold text-gray-700 text-xs uppercase tracking-wider">Price</th>
              <th className="text-center p-2 font-semibold text-gray-700 text-xs uppercase tracking-wider">Quantity</th>
              <th className="text-right p-2 font-semibold text-gray-700 text-xs uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item: SaleItem, index: number) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50 print:bg-gray-50'} border-b border-gray-100 print:border-gray-200`}>
                <td className="p-2 text-gray-600 align-top">
                  {item.itemName}
                  {item.description && <span className="block text-xs text-gray-500 pt-0.5">{item.description}</span>}
                </td>
                <td className="text-right p-2 text-gray-600 align-top">{formatCurrency(item.priceUnit)}</td>
                <td className="text-center p-2 text-gray-600 align-top">{item.qty}</td>
                <td className="text-right p-2 text-gray-600 align-top">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end pt-2 pb-6 border-b border-gray-200">
        <div className="w-full sm:w-2/5 space-y-1">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(sale.subTotal)}</span>
          </div>
          {sale.totalItemDiscount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Item Discounts</span>
              <span className="text-red-500">-{formatCurrency(sale.totalItemDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Tax ({((sale.totalTax / (sale.subTotal - sale.totalItemDiscount || sale.subTotal || 1)) * 100 || 0).toFixed(0)}%)</span>
            <span>{formatCurrency(sale.totalTax)}</span>
          </div>
          {sale.roundOff !== 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Round Off</span>
              <span>{sale.roundOff < 0 ? '-' : ''}{formatCurrency(Math.abs(sale.roundOff))}</span>
            </div>
          )}
          <div className="border-t border-gray-200 my-1"></div>
          <div className="flex justify-between text-gray-800 font-bold text-lg">
            <span>Grand Total</span>
            <span>{formatCurrency(sale.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method & Balance Due Section */}
      <div className="py-6 border-b border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-2">Payment Details</h3>
        {sale.payments.map((p, i) => (
          <div key={i} className="text-gray-600 mb-0.5">
            {p.mode}: {formatCurrency(p.amount)} {p.paymentDate ? `(on ${formatDate(p.paymentDate)})` : ''}
          </div>
        ))}
        {sale.amountReceived < sale.totalAmount && sale.status !== 'Returned' && sale.status !== 'Cancelled' && (
          <div className="mt-2 text-red-600 font-semibold">
              Balance Due: {formatCurrency(sale.totalAmount - sale.amountReceived)}
          </div>
        )}
         {sale.changeGiven > 0 && (
          <div className="mt-2 text-gray-600">
              Change Given: {formatCurrency(sale.changeGiven)}
          </div>
        )}
      </div>

      {/* Terms & Signature Section */}
      <div className="py-6">
        {storeDetails.terms && (
            <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-1">Terms & Conditions</h3>
                <p className="text-gray-500 text-xs">{storeDetails.terms}</p>
            </div>
        )}
        
        {storeDetails.authorizedSignature && (
          <div className="text-right mt-8">
            <div className="inline-block">
              <p className="text-gray-600 mb-4 italic h-8"> {/* Placeholder for signature image or space */} </p>
              <p className="text-gray-600 border-t border-gray-400 pt-1 text-xs">{storeDetails.authorizedSignature}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="text-center pt-6 mt-4 border-t border-gray-300">
        <p className="text-gray-600 font-semibold mb-1 uppercase tracking-wider">Thank You For Your Business!</p>
        {storeDetails.website && <p className="text-gray-500 text-xs">{storeDetails.website}</p>}
      </div>
    </div>
  );
}
