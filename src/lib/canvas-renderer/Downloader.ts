import { jsPDF } from 'jspdf';

export class Downloader {
  private static activeUrls: Set<string> = new Set();

  /**
   * Converts a Blob to a Base64 Data URL.
   */
  public static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert Blob to Base64 string'));
        }
      };
      reader.onerror = () => reject(reader.error || new Error('FileReader reading error'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Downloads a Blob in the browser and releases the resource.
   */
  public static downloadBlob(blob: Blob, filename: string): void {
    console.log(`[Downloader] Attempting download for Blob. Size: ${blob.size} bytes, Filename: ${filename}`);
    let url = '';
    try {
      url = URL.createObjectURL(blob);
      console.log(`[Downloader] Created Object URL: ${url}`);
      this.activeUrls.add(url);
    } catch (createErr: any) {
      console.error('[Downloader] Failed to create Object URL, falling back to Base64:', createErr);
      // Try Base64 fallback right away
      this.blobToBase64(blob)
        .then((base64Url) => {
          console.log(`[Downloader] Created Base64 fallback URL. Length: ${base64Url.length}`);
          this.triggerAnchorDownload(base64Url, filename);
        })
        .catch((base64Err) => {
          console.error('[Downloader] Base64 fallback conversion also failed:', base64Err);
          throw new Error(`ডাউনলোড ইউআরএল অবজেক্ট তৈরিতে ব্রাউজারে সমস্যা হয়েছে: ${base64Err.message}`);
        });
      return;
    }

    try {
      this.triggerAnchorDownload(url, filename);
      
      // Cleanup after a long delay (15 seconds) to ensure mobile browsers complete downloading
      const urlToClean = url;
      setTimeout(() => {
        try {
          if (this.activeUrls.has(urlToClean)) {
            URL.revokeObjectURL(urlToClean);
            this.activeUrls.delete(urlToClean);
            console.log(`[Downloader] Cleaned up Object URL: ${urlToClean}`);
          }
        } catch (cleanupErr) {
          console.warn('[Downloader] Silent cleanup warning:', cleanupErr);
        }
      }, 15000); // 15 seconds
    } catch (e: any) {
      console.error('[Downloader] Failed during anchor click download process:', e);
      // Retry converting to Base64 if Object URL click fails
      console.log('[Downloader] Retrying download using Base64 Data URL...');
      this.blobToBase64(blob)
        .then((base64Url) => {
          this.triggerAnchorDownload(base64Url, filename);
        })
        .catch((base64Err) => {
          throw new Error(`ডাউনলোড লিংক ট্রিগার করার সময় অপ্রত্যাশিত ব্রাউজার সমস্যা দেখা দিয়েছে: ${e.message}`);
        });
    }
  }

  /**
   * Helper to append, click and remove anchor link
   */
  private static triggerAnchorDownload(url: string, filename: string): void {
    console.log(`[Downloader] Appending temporary anchor link for ${filename}`);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Some browsers require the link to be attached to the DOM to trigger download
    document.body.appendChild(link);
    
    console.log(`[Downloader] Triggering click() on anchor link`);
    link.click();
    
    // Small timeout before removing from DOM to prevent race conditions on old engines
    setTimeout(() => {
      try {
        if (link.parentNode) {
          document.body.removeChild(link);
          console.log(`[Downloader] Removed temporary anchor link from DOM`);
        }
      } catch (domErr) {
        console.warn('[Downloader] Temporary anchor node removal failed:', domErr);
      }
    }, 300);
  }

  /**
   * Triggers a PDF download.
   */
  public static downloadPDF(pdf: jsPDF, filename: string) {
    try {
      console.log(`[Downloader] Triggering jsPDF.save() for: ${filename}`);
      pdf.save(filename);
      console.log(`[Downloader] jsPDF save executed successfully`);
    } catch (e: any) {
      console.error('[Downloader] Failed to save PDF:', e);
      throw new Error(`PDF ফাইল সংরক্ষণ করতে ব্রাউজার ব্যর্থ হয়েছে: ${e.message}`);
    }
  }

  /**
   * Clear all active URLs (used on destroy to prevent memory leaks)
   */
  public static clearAll() {
    console.log(`[Downloader] Clearing all active object URLs: ${this.activeUrls.size} items`);
    this.activeUrls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        // ignore
      }
    });
    this.activeUrls.clear();
  }
}
