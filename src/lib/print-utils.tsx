
'use client';

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
  // 1. Open the window immediately
  const printWindow = window.open('', '_blank', 'height=800,width=800,noopener,noreferrer');

  if (!printWindow) {
    alert("Could not open print window. Please check your browser's pop-up blocker settings.");
    console.error("Failed to open print window. It might be blocked by a pop-up blocker.");
    return;
  }

  // Render the invoice HTML string
  const invoiceHTML = renderToString(
    <InvoiceTemplate sale={saleData} storeDetails={mockStoreDetails} />
  );

  // Write basic structure and title
  printWindow.document.write('<html><head><title>Print Invoice</title></head><body></body></html>');
  printWindow.document.close(); // Close the document stream opened by write()

  // Inject content and styles
  printWindow.document.body.innerHTML = invoiceHTML; // Place the rendered HTML into the body

  fetch('/components/invoice/invoice-template.css')
    .then(response => {
      if (!response.ok) {
        throw new Error(`CSS fetch failed with status ${response.status}`);
      }
      return response.text();
    })
    .then(css => {
      const styleEl = printWindow.document.createElement('style');
      styleEl.textContent = css;
      printWindow.document.head.appendChild(styleEl);
      waitForImagesAndPrint(printWindow); // Proceed to print after CSS is applied
    })
    .catch(err => {
      console.error("Failed to load print CSS:", err);
      // Proceed without custom styles if CSS fails, or handle error appropriately
      waitForImagesAndPrint(printWindow);
    });
}


function waitForImagesAndPrint(printWindow: Window) {
    const images = Array.from(printWindow.document.images);
    let loadedImagesCount = 0;
    const totalImages = images.length;

    const proceedToPrint = () => {
      // A small delay can sometimes help ensure all rendering is complete.
      setTimeout(() => {
        try {
            if (printWindow && !printWindow.closed) {
                printWindow.focus(); // Required for some browsers
                printWindow.print();
                // Consider closing the window after print dialog, or leave it open
                // printWindow.close();
            } else {
                console.warn("Print window was closed before printing could occur.");
            }
        } catch (e) {
            console.error("Error during print window focus or print call:", e);
             alert("An error occurred while trying to print. Please try again.");
        }
      }, 150); // Slightly increased delay for rendering
    };

    if (totalImages === 0) {
      proceedToPrint();
      return;
    }

    images.forEach(img => {
      const imageLoadOrErrorHandler = () => {
        loadedImagesCount++;
        if (loadedImagesCount === totalImages) {
          proceedToPrint();
        }
      };

      // Check if image is already loaded (e.g., from cache or broken link)
      if (img.complete) {
        if (img.naturalHeight === 0 && img.src) { // Check src to avoid warning for decorative images without src
          console.warn("Invoice image might be broken or failed to load (naturalHeight is 0):", img.src);
        }
        imageLoadOrErrorHandler();
      } else {
        img.onload = imageLoadOrErrorHandler;
        img.onerror = () => {
          console.warn("Invoice image failed to load:", img.src);
          imageLoadOrErrorHandler(); // Count as "processed" to not block printing
        };
      }
    });

    // Fallback: If some images never fire onload/onerror (e.g. network issues, very slow load)
    // and they weren't 'complete' initially, we might need a timeout to proceed anyway.
    // For now, relying on onload/onerror. If printing stalls, this is an area to investigate.
}
