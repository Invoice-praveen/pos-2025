
'use client';

import type { Sale, CompanySettings } from '@/types';
import { renderToString } from 'react-dom/server';
import { InvoiceTemplate } from '../components/invoice/invoice-template';

async function fetchCSS(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch CSS from ${url}: ${response.status} ${response.statusText}`);
      return '';
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching CSS from ${url}:`, error);
    return '';
  }
}

export async function triggerPrint(saleData: Sale, storeDetails: CompanySettings | null) {
  // Try to open print window with more specific parameters
  const printWindow = window.open('', '_blank', 'height=800,width=800,scrollbars=yes,resizable=yes');

  if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
    alert("Could not open print window. Please check your browser's pop-up blocker settings.");
    console.error("Failed to open print window. It might be blocked by a pop-up blocker.");
    return;
  }
  
  const effectiveStoreDetails = storeDetails || { // Provide defaults if settings are null
    storeName: "Your Store",
    storeAddress: "123 Default St, Anytown",
    storePhone: "N/A",
    storeEmail: "N/A",
    storeWebsite: "N/A",
    logoUrl: "",
    invoiceTagline: "Thank you for your business!",
    defaultTaxRate: 0,
    receiptHeader: "",
    receiptFooter: "",
    invoiceTerms: "Payment due upon receipt.",
    authorizedSignature: "Management",
    enableLowStockAlerts: true,
  };


  try {
    const invoiceHTML = renderToString(
      <InvoiceTemplate sale={saleData} storeDetails={effectiveStoreDetails} />
    );

    let cssContent = '';
    try {
      // Assuming invoice-template.css is in public/css/
      cssContent = await fetchCSS('/css/invoice-template.css'); 
      if (!cssContent) {
          console.warn('Fetched CSS content is empty. Check path and file content.');
      }
    } catch (error) {
      console.warn('Failed to load CSS, proceeding without external styles:', error);
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - ${saleData.id?.substring(0, 8) || 'N/A'}</title>
        <script src="https://cdn.tailwindcss.com"></script> 
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
          ${cssContent}
        </style>
      </head>
      <body>
        ${invoiceHTML}
        <script>
          document.addEventListener('DOMContentLoaded', function() { console.log('Document loaded, preparing to print...'); });
          // Auto-print after a short delay may not always work due to browser restrictions,
          // but waitForImagesAndPrint will attempt it after images.
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();

    waitForImagesAndPrint(printWindow);

  } catch (error) {
    console.error('Error in triggerPrint constructing HTML:', error);
    alert('An error occurred while preparing the print document.');
    if (printWindow && !printWindow.closed) printWindow.close();
  }
}

function waitForImagesAndPrint(printWindow: Window) {
  if (!printWindow || printWindow.closed) {
    console.warn("Print window was closed before processing images.");
    return;
  }

  const images = Array.from(printWindow.document.images);
  const totalImages = images.length;
  let loadedImagesCount = 0;
  let printTriggered = false;

  const proceedToPrint = () => {
    if (printTriggered) return;
    printTriggered = true;

    setTimeout(() => {
      try {
        if (printWindow && !printWindow.closed) {
          console.log('Focusing print window and triggering print...');
          printWindow.focus();
          printWindow.print();
        } else {
          console.warn("Print window was closed before printing could occur.");
        }
      } catch (e) {
        console.error("Error during print window focus or print call:", e);
        if (printWindow && !printWindow.closed) {
          try {
            printWindow.print(); // Fallback print
          } catch (printError) {
            console.error("Fallback print also failed:", printError);
            alert("Unable to trigger print. Please use Ctrl+P or Cmd+P to print manually.");
          }
        }
      }
    }, 750); // Slightly increased delay
  };

  if (totalImages === 0) {
    console.log('No images found, proceeding to print immediately');
    proceedToPrint();
    return;
  }

  console.log(`Waiting for ${totalImages} images to load...`);

  images.forEach((img, index) => {
    const imageLoadHandler = () => {
      img.removeEventListener('load', imageLoadHandler);
      img.removeEventListener('error', imageErrorHandler);
      loadedImagesCount++;
      console.log(`Image ${index + 1}/${totalImages} processed (load).`);
      if (loadedImagesCount === totalImages) {
        console.log('All images processed, proceeding to print');
        proceedToPrint();
      }
    };
    const imageErrorHandler = () => {
      img.removeEventListener('load', imageLoadHandler);
      img.removeEventListener('error', imageErrorHandler);
      loadedImagesCount++;
      console.warn(`Image ${index + 1}/${totalImages} failed to load: ${img.src}`);
      if (loadedImagesCount === totalImages) {
        console.log('All images processed (some failed), proceeding to print');
        proceedToPrint();
      }
    };

    if (img.complete) {
      if (img.naturalHeight === 0 && img.src && !img.src.startsWith('data:')) {
         console.warn("Image might be broken (already complete but no height):", img.src);
      }
      imageLoadHandler(); // Already loaded
    } else {
      img.addEventListener('load', imageLoadHandler);
      img.addEventListener('error', imageErrorHandler);
    }
  });

  const fallbackTimeout = setTimeout(() => {
    if (!printTriggered) {
      console.warn(`Print fallback: Not all images loaded after timeout. Proceeding with print for ${loadedImagesCount}/${totalImages} images.`);
      proceedToPrint();
    }
  }, 7000); // 7 seconds fallback

  const clearFallback = () => clearTimeout(fallbackTimeout);
  
  // Check if all images done to clear timeout
  const intervalCheck = setInterval(() => {
    if (loadedImagesCount === totalImages || printTriggered) {
      clearFallback();
      clearInterval(intervalCheck);
    }
  }, 100);

}

