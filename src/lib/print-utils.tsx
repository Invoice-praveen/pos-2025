
import type { Sale } from '@/types';
import { renderToString } from 'react-dom/server';
import { InvoiceTemplate } from '@/components/invoice/invoice-template';

// Mock store details - in a real app, this would come from settings
const mockStoreDetails = {
  name: "OrderFlow Solutions",
  tagline: "Streamlining Your Success",
  address: "123 Commerce St, Business City, Zip 12345",
  phone: "+1 (555) 010-0000",
  email: "contact@orderflow.store",
  website: "www.orderflow.store",
  logoUrl: "", // Add a URL to your logo e.g. /logo.png (place in public folder)
  terms: "All sales are final. Returns accepted within 30 days with original receipt for store credit only. Defective items will be exchanged or repaired at our discretion.",
  authorizedSignature: "OrderFlow Management",
};

export function triggerPrint(saleData: Sale) {
  const invoiceHTML = renderToString(
    <InvoiceTemplate sale={saleData} storeDetails={mockStoreDetails} />
  );

  const printWindow = window.open('', '_blank', 'height=800,width=800,noopener,noreferrer');
  if (printWindow) {
    printWindow.document.write('<html><head><title>Print Invoice</title>');
    
    // Attempt to load CSS. 
    // It's generally better to inject CSS as a string for reliability in new windows.
    // For simplicity with create-react-app or similar, linking to a public CSS file can work during dev.
    // For production, ensure this CSS file is in your `public` directory or its content is bundled.
    
    // Fetch and inject CSS content directly
    fetch('/components/invoice/invoice-template.css')
      .then(response => response.text())
      .then(css => {
        const styleEl = printWindow.document.createElement('style');
        styleEl.textContent = css;
        printWindow.document.head.appendChild(styleEl);
        
        // Now that CSS is loaded, proceed with content and print
        printWindow.document.body.innerHTML = invoiceHTML;
        printWindow.document.close(); // Important for some browsers

        waitForImagesAndPrint(printWindow);
      })
      .catch(err => {
        console.error("Failed to load print CSS:", err);
        // Proceed without custom styles if CSS fails, or handle error appropriately
        printWindow.document.body.innerHTML = invoiceHTML;
        printWindow.document.close();
        waitForImagesAndPrint(printWindow);
      });

  } else {
    alert("Could not open print window. Please check your browser's pop-up blocker settings.");
  }
}


function waitForImagesAndPrint(printWindow: Window) {
    const images = printWindow.document.images;
    let loadedImages = 0;
    const totalImages = images.length;

    const proceedToPrint = () => {
      printWindow.focus(); // Required for some browsers
      printWindow.print();
      // printWindow.close(); // Optional: close window after print dialog
    };

    if (totalImages === 0) {
      // If no images, wait a bit for CSS to apply from previous step, then print
      setTimeout(proceedToPrint, 500); 
    } else {
      Array.from(images).forEach(img => {
        const imageLoadHandler = () => {
          loadedImages++;
          if (loadedImages === totalImages) {
            setTimeout(proceedToPrint, 250); // Short delay after images for rendering
          }
        };
        
        img.onload = imageLoadHandler;
        img.onerror = () => { 
          loadedImages++; 
          console.warn("Invoice image failed to load:", img.src);
          if (loadedImages === totalImages) {
            setTimeout(proceedToPrint, 250);
          }
        };
        // Handle images that might already be cached and loaded
        if (img.complete && img.naturalHeight !== 0) {
            // If already complete, manually trigger the logic
            imageLoadHandler();
        }
      });
    }
}

