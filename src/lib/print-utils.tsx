
import type { Sale } from '@/types';
import { renderToString } from 'react-dom/server';
import { InvoiceTemplate } from '@/components/invoice/invoice-template';

// Mock store details - in a real app, this would come from settings
const mockStoreDetails = {
  name: "OrderFlow Store",
  address: "123 Commerce St, Business City, 12345",
  phone: "+1 (555) 010-0000",
  email: "contact@orderflow.store",
  website: "www.orderflow.store",
  logoUrl: "", // Add a URL to your logo if you have one
  terms: "All sales are final. Returns accepted within 30 days with original receipt for store credit only. Defective items will be exchanged or repaired at our discretion.",
  authorizedSignature: "OrderFlow Management",
};

export function triggerPrint(saleData: Sale) {
  const invoiceHTML = renderToString(
    <InvoiceTemplate sale={saleData} storeDetails={mockStoreDetails} />
  );

  const printWindow = window.open('', '_blank', 'height=800,width=800');
  if (printWindow) {
    printWindow.document.write('<html><head><title>Print Invoice</title>');
    
    const style = printWindow.document.createElement('style');
    
    fetch('/components/invoice/invoice-template.css')
      .then(response => response.text())
      .then(css => {
        style.textContent = css;
        printWindow.document.head.appendChild(style);

        printWindow.document.body.innerHTML = invoiceHTML;
        
        const images = printWindow.document.images;
        let loadedImages = 0;
        const totalImages = images.length;

        if (totalImages === 0) {
            proceedToPrint();
        } else {
            for (let i = 0; i < totalImages; i++) {
                images[i].onload = () => {
                    loadedImages++;
                    if (loadedImages === totalImages) {
                        proceedToPrint();
                    }
                };
                images[i].onerror = () => { 
                    loadedImages++; 
                    if (loadedImages === totalImages) {
                        proceedToPrint();
                    }
                };
            }
        }
        
        function proceedToPrint() {
          setTimeout(() => {
            printWindow.print();
          }, 250); 
        }

      }).catch(err => {
        console.error("Failed to load print CSS:", err);
        printWindow.document.body.innerHTML = invoiceHTML;
        setTimeout(() => printWindow.print(), 250);
      });
    printWindow.document.write('</head><body>');
    printWindow.document.write('</body></html>');
  } else {
    alert("Could not open print window. Please check your browser's pop-up blocker settings.");
  }
}
