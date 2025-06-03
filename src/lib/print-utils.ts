
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
    // Inject Tailwind (consider a slimmed-down version or pre-built print CSS)
    // For simplicity, directly linking to Play CDN. For production, bundle your print CSS.
    // printWindow.document.write('<link href="https://cdn.tailwindcss.com" rel="stylesheet">');
    
    // Inject specific print CSS
    // Create a style element
    const style = printWindow.document.createElement('style');
    // The CSS content is fetched from invoice-template.css. 
    // In a real build setup, you'd import this CSS as a string or link to a bundled asset.
    // For this example, we'll assume `invoiceTemplateCss` is available.
    // This is a placeholder, you'll need to load the CSS content correctly.
    fetch('/components/invoice/invoice-template.css')
      .then(response => response.text())
      .then(css => {
        style.textContent = css;
        printWindow.document.head.appendChild(style);

        printWindow.document.body.innerHTML = invoiceHTML;
        
        // Ensure images and styles are loaded before printing
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
                images[i].onerror = () => { // Handle image loading errors
                    loadedImages++; 
                    if (loadedImages === totalImages) {
                        proceedToPrint();
                    }
                };
            }
        }
        
        function proceedToPrint() {
          // Small delay to ensure rendering, especially for complex CSS or web fonts
          setTimeout(() => {
            printWindow.print();
            // Optional: Close window after print dialog, but browser settings might prevent this
            // setTimeout(() => printWindow.close(), 100); 
          }, 250); // Adjust delay as needed
        }

      }).catch(err => {
        console.error("Failed to load print CSS:", err);
        // Fallback: print without custom styles if CSS load fails
        printWindow.document.body.innerHTML = invoiceHTML;
        setTimeout(() => printWindow.print(), 250);
      });
    printWindow.document.write('</head><body>');
    printWindow.document.write('</body></html>');
    // printWindow.document.close(); // Important for some browsers
  } else {
    alert("Could not open print window. Please check your browser's pop-up blocker settings.");
  }
}

// You might need to expose the CSS content for the iframe method if new window is problematic
// For example, by having a build step that imports it as a string.
// Or, include the styles directly in the InvoiceTemplate component for printing (less ideal for separation).
