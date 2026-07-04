import { jsPDF } from 'jspdf';
import { Exporter } from './Exporter';

export interface ExportValidationResult {
  isValid: boolean;
  error?: string;
  isTainted: boolean;
}

export class ExportManager {
  /**
   * Validates if the canvas is in a healthy exportable state (dimensions > 0 and not tainted).
   */
  public static validateCanvas(canvas: HTMLCanvasElement): ExportValidationResult {
    if (canvas.width <= 0 || canvas.height <= 0) {
      return {
        isValid: false,
        isTainted: false,
        error: `ক্যানভাসের সাইজ শূন্য (${canvas.width}x${canvas.height})। রেন্ডারিং অসম্পূর্ণ।`
      };
    }

    // Check if canvas is tainted by attempting to read a single pixel
    try {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.getImageData(0, 0, 1, 1);
      }
      return { isValid: true, isTainted: false };
    } catch (e: any) {
      console.error('[ExportManager] Canvas is tainted:', e);
      return {
        isValid: false,
        isTainted: true,
        error: 'ক্যানভাস এক্সপোর্ট সিকিউরিটি এরর (CORS Taint): বাহ্যিক কোনো ইমেজ রিসোর্স (যেমন ফিচার্ড ইমেজ বা লোগো) সরাসরি লোড করায় ব্রাউজার সিকিউরিটি পলিসি ক্যানভাসটিকে লক করে দিয়েছে। দয়া করে নিশ্চিত করুন সবগুলো ছবি সঠিক সিকিউর প্রক্সির মাধ্যমে লোড হয়েছে।'
      };
    }
  }

  /**
   * Safely exports the canvas to a Blob or PDF with rigorous validations on output size and extensions.
   */
  public static async exportAndValidate(
    canvas: HTMLCanvasElement,
    format: 'png' | 'jpeg' | 'webp' | 'pdf',
    filename: string
  ): Promise<Blob | { pdf: jsPDF; filename: string }> {
    // 1. Verify canvas first
    const validation = this.validateCanvas(canvas);
    if (!validation.isValid) {
      throw new Error(validation.error || 'রেন্ডার ভ্যালিডেশন ব্যর্থ হয়েছে।');
    }

    // 2. Perform the export using our Exporter
    const result = await Exporter.exportCanvas(canvas, { format, filename });

    // 3. Validate download-ready blob
    if (result instanceof Blob) {
      if (result.size <= 0) {
        throw new Error('এক্সপোর্টকৃত ফাইল সাইজ শূন্য (Empty Blob)। পুনরায় চেষ্টা করুন।');
      }
      
      const fileExt = filename.split('.').pop()?.toLowerCase();
      if (!fileExt || !['png', 'jpeg', 'jpg', 'webp'].includes(fileExt)) {
        throw new Error(`এক্সপোর্টকৃত ফাইলে অমান্য এক্সটেনশন পাওয়া গেছে: .${fileExt}`);
      }
    } else {
      // PDF validation
      if (!result.pdf || !result.filename.endsWith('.pdf')) {
        throw new Error('এক্সপোর্টকৃত PDF ফাইলটি করাপ্টেড বা অমান্য ফরম্যাট।');
      }
    }

    return result;
  }
}
