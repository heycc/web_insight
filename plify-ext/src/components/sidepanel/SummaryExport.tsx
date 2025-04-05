import { toPng } from 'html-to-image';
import React from 'react';

interface ExportSummaryOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  title?: string;
  url?: string;
  filename?: string;
}

/**
 * Creates header element for the export
 */
const createExportHeader = (title?: string, url?: string): HTMLDivElement => {
  const header = document.createElement('div');
  header.className = 'export-image-header';
  // Use title or fall back to default
  header.textContent = title || 'Web Content Summary';
  
  // Add URL beneath the title if available
  if (url) {
    const urlElement = document.createElement('div');
    urlElement.className = 'text-xs text-gray-400 mt-1 url-wrap';
    urlElement.textContent = url;
    header.appendChild(urlElement);
  }
  
  return header;
};

/**
 * Creates footer element for the export
 */
const createExportFooter = (): HTMLDivElement => {
  const footer = document.createElement('div');
  footer.className = 'export-image-footer flex justify-between items-center';
  
  // Text content div
  const textDiv = document.createElement('div');
  textDiv.innerHTML = 'Generated with Plify AI Insight.<br>https://plify.co';
  footer.appendChild(textDiv);
  
  // Brand icon div
  const iconDiv = document.createElement('div');
  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL('icon/plify.png');
  icon.alt = 'Plify Logo';
  icon.className = 'h-6 w-auto';
  iconDiv.appendChild(icon);
  footer.appendChild(iconDiv);
  
  return footer;
};

/**
 * Exports the summary content as a PNG image
 * @param options Configuration options for the export
 */
export const exportSummaryAsImage = async ({
  containerRef,
  title,
  url,
  filename = 'plify-summary.png'
}: ExportSummaryOptions): Promise<void> => {
  if (!containerRef.current) return;
  
  // Create and style temporary export container
  const exportContainer = document.createElement('div');
  // Apply class for styled background texture
  exportContainer.className = 'export-image-container';
  
  // Add header
  const header = createExportHeader(title, url);
  exportContainer.appendChild(header);
  
  // Create a content wrapper div with margin
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'bg-white p-4 rounded-xl';
  
  // Clone the content instead of just copying innerHTML
  // This preserves all styling and layout exactly as it appears
  const originalContent = containerRef.current;
  const contentStyles = window.getComputedStyle(originalContent);
  
  // Create a content element that matches the original content's dimensions and styles
  const contentClone = document.createElement('div');
  
  // Copy the computed styles that affect layout and appearance
  contentClone.style.width = contentStyles.width;
  contentClone.style.maxWidth = contentStyles.maxWidth;
  contentClone.style.minHeight = contentStyles.minHeight;
  contentClone.style.maxHeight = 'none'; // Remove height constraints
  contentClone.style.overflowY = 'visible'; // Ensure no scrollbars
  contentClone.style.overflowX = 'visible';
  
  // Copy the HTML content
  contentClone.innerHTML = originalContent.innerHTML;
  
  // Add the cloned content to the wrapper
  contentWrapper.appendChild(contentClone);
  
  // Add the content wrapper to the export container
  exportContainer.appendChild(contentWrapper);
  
  // Add footer with Plify attribution
  const footer = createExportFooter();
  exportContainer.appendChild(footer);
  
  try {
    // Add to DOM, render, and capture
    document.body.appendChild(exportContainer);
    // Allow time for styles to apply
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Now set the container width based on the content
    const paddingWidth = 16 * 2; // 16px padding on each side
    const contentWrapperWidth = contentWrapper.offsetWidth;
    exportContainer.style.width = `${contentWrapperWidth + paddingWidth}px`;
    
    // Allow additional time for styles to apply
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate PNG with high quality
    const dataUrl = await toPng(exportContainer, {
      pixelRatio: 2,
      cacheBust: true
    });
    
    // Trigger download
    downloadImage(dataUrl, filename);
    
    // Clean up
    document.body.removeChild(exportContainer);
  } catch (error) {
    // Clean up even if there's an error
    if (document.body.contains(exportContainer)) {
      document.body.removeChild(exportContainer);
    }
    throw error;
  }
};

/**
 * Helper function to trigger the download of an image
 */
const downloadImage = (dataUrl: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}; 