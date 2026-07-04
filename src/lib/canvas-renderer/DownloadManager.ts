import { Downloader } from './Downloader';
import { jsPDF } from 'jspdf';

export class DownloadManager {
  /**
   * Safe entry point to download any exported Blob or PDF file.
   */
  public static download(
    exportResult: Blob | { pdf: jsPDF; filename: string },
    filename: string
  ): void {
    if (exportResult instanceof Blob) {
      console.log(`[DownloadManager] Starting download process for Blob. Size: ${exportResult.size} bytes`);
      if (exportResult.size === 0) {
        throw new Error('ডাউনলোড ফাইলটির আকার শূন্য বাইট। ফাইল সংরক্ষণ করা অসম্ভব।');
      }
      Downloader.downloadBlob(exportResult, filename);
    } else {
      console.log('[DownloadManager] Starting download process for PDF');
      Downloader.downloadPDF(exportResult.pdf, exportResult.filename);
    }
  }
}
