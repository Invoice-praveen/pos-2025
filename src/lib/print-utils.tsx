
'use client';

import type { Sale } from '@/types';
import { renderToString } from 'react-dom/server';
import { InvoiceTemplate } from '../components/invoice/invoice-template';

// Mock store details - in a real app, this would come from settings
const mockStoreDetails = {
  name: "Abipravi",
  tagline: "Streamlining Your Success",
  address: "123 Commerce St, Business City, Zip 12345",
  phone: "+1 (555) 010-0000",
  email: "contact@orderflow.store",
  website: "www.orderflow.store",
  logoUrl: "data:image/jpeg;base64,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", 
  terms: "All sales are final. Returns accepted within 30 days with original receipt for store credit only. Defective items will be exchanged or repaired at our discretion.",
  authorizedSignature: "OrderFlow Management",
};

async function fetchCSS(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch CSS from ${url}: ${response.status} ${response.statusText}`);
      return ''; // Return empty string on failure
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching CSS from ${url}:`, error);
    return ''; // Return empty string on network error
  }
}

export async function triggerPrint(saleData: Sale) {
  const printWindow = window.open('', '_blank', 'height=800,width=800,noopener,noreferrer');

  if (!printWindow) {
    alert("Could not open print window. Please check your browser's pop-up blocker settings.");
    console.error("Failed to open print window. It might be blocked by a pop-up blocker.");
    return;
  }

  const invoiceHTML = renderToString(
    <InvoiceTemplate sale={saleData} storeDetails={mockStoreDetails} />
  );

  // Fetch the CSS content
  // Ensure the path to your CSS file is correct as served by your dev server or from public folder in production
  const cssContent = await fetchCSS('/components/invoice/invoice-template.css');

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${saleData.id?.substring(0, 8) || 'N/A'}</title>
      <style>
        ${cssContent}
      </style>
    </head>
    <body>
      ${invoiceHTML}
      <script>
        // Optional: Script to trigger print after images load if necessary
        // This simplified version prints directly after content is set.
        // For robust image loading, a more complex script here might be needed.
        // window.onload = function() { window.print(); }; 
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(fullHtml);
  printWindow.document.close();

  // Wait for images to load before printing
  waitForImagesAndPrint(printWindow);
}


function waitForImagesAndPrint(printWindow: Window) {
  const images = Array.from(printWindow.document.images);
  const totalImages = images.length;
  let loadedImagesCount = 0;

  const proceedToPrint = () => {
    setTimeout(() => {
      try {
        if (printWindow && !printWindow.closed) {
          printWindow.focus();
          printWindow.print();
          // Consider closing the window after print dialog, or leave it open
          // printWindow.close(); 
        } else {
          console.warn("Print window was closed before printing could occur.");
        }
      } catch (e) {
        console.error("Error during print window focus or print call:", e);
        if (printWindow && !printWindow.closed) {
          // Potentially alert the user if focus/print fails but window is open
        }
      }
    }, 250); // Increased delay slightly for rendering and CSS application
  };

  if (totalImages === 0) {
    proceedToPrint();
    return;
  }

  images.forEach(img => {
    const imageLoadHandler = () => {
      loadedImagesCount++;
      if (loadedImagesCount === totalImages) {
        proceedToPrint();
      }
    };

    if (img.complete) { // Image already loaded (e.g., from cache or data URI)
      if (img.naturalHeight === 0 && img.src && !img.src.startsWith('data:')) {
        // For non-data URI images, naturalHeight 0 suggests a broken link
        console.warn("Invoice image might be broken or failed to load (naturalHeight is 0):", img.src);
      }
      imageLoadHandler();
    } else {
      img.onload = imageLoadHandler;
      img.onerror = () => {
        console.warn("Invoice image failed to load:", img.src);
        imageLoadHandler(); // Count as "processed" to not block printing
      };
    }
  });

  // Fallback timeout in case some images never fire onload/onerror
  // This is a safety net to prevent the print from stalling indefinitely
  // Adjust timeout as needed, but it shouldn't be too short.
  const fallbackTimeout = setTimeout(() => {
    if (loadedImagesCount < totalImages) {
      console.warn(`Print fallback: Not all images loaded after timeout. Proceeding with print for ${loadedImagesCount}/${totalImages} images.`);
      proceedToPrint();
    }
  }, 5000); // 5 seconds fallback

  // Clear fallback if all images load
  if (totalImages > 0) {
      const allLoadedCheck = () => {
          if (loadedImagesCount === totalImages) {
              clearTimeout(fallbackTimeout);
          }
      };
      images.forEach(img => {
          if(img.complete) {
            // If already complete, check immediately
            allLoadedCheck(); 
          } else {
            img.addEventListener('load', allLoadedCheck);
            img.addEventListener('error', allLoadedCheck);
          }
      });
  }

}
