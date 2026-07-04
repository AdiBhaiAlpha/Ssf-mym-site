import { jsPDF } from 'jspdf';

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'webp' | 'pdf';
  quality?: number; // 0.0 to 1.0
  filename: string;
}

export class Exporter {
  /**
   * Export canvas as a Blob or PDF
   */
  public static async exportCanvas(
    canvas: HTMLCanvasElement,
    options: ExportOptions
  ): Promise<Blob | { pdf: jsPDF; filename: string }> {
    const format = options.format;
    const quality = options.quality ?? 0.95;

    console.log(`[Exporter] Initiating export for format: ${format}, filename: ${options.filename}`);

    if (format === 'pdf') {
      try {
        console.log(`[Exporter] Rendering PDF canvas data URL...`);
        const imgData = canvas.toDataURL('image/png');
        const width = canvas.width;
        const height = canvas.height;

        console.log(`[Exporter] Creating jsPDF document. Width: ${width}, Height: ${height}`);
        const pdf = new jsPDF({
          orientation: width > height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [width, height],
          compress: true
        });

        pdf.addImage(imgData, 'PNG', 0, 0, width, height, undefined, 'FAST');
        console.log(`[Exporter] PDF created successfully.`);
        return { pdf, filename: options.filename };
      } catch (e: any) {
        console.error(`[Exporter] PDF generation failed:`, e);
        if (e.name === 'SecurityError' || e.message?.toLowerCase().includes('taint') || e.message?.toLowerCase().includes('secure')) {
          throw new Error('ক্যানভাস এক্সপোর্ট সিকিউরিটি এরর (CORS Taint): কোনো বাহ্যিক ইমেজ রিসোর্স (যেমন ফিচার্ড ইমেজ বা লোগো) CORS নীতি বা নিরাপত্তা লঙ্ঘন করেছে। দয়া করে নিশ্চিত করুন সবগুলো ছবি সঠিক সিকিউর প্রক্সির মাধ্যমে লোড হয়েছে।');
        }
        throw new Error(`PDF তৈরিতে সমস্যা হয়েছে: ${e.message}`);
      }
    }

    // Standard image formats using toBlob
    let mimeType = 'image/png';
    const fmt: string = format;
    if (fmt === 'jpeg' || fmt === 'jpg') {
      mimeType = 'image/jpeg';
    } else if (fmt === 'webp') {
      mimeType = 'image/webp';
    }

    console.log(`[Exporter] Creating Blob with mimeType: ${mimeType}, quality: ${quality}`);
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`[Exporter] Blob created successfully. Size: ${blob.size} bytes`);
              resolve(blob);
            } else {
              console.error(`[Exporter] Failed to create canvas blob - returned null`);
              reject(new Error('ক্যানভাস থেকে ছবি (Blob) অবজেক্ট তৈরি করতে ব্রাউজার ব্যর্থ হয়েছে (সম্ভবত ডিভাইসের মেমরি বা সিপিইউ সীমাবদ্ধতার কারণে)।'));
            }
          },
          mimeType,
          quality
        );
      } catch (e: any) {
        console.error(`[Exporter] toBlob failed:`, e);
        if (e.name === 'SecurityError' || e.message?.toLowerCase().includes('taint') || e.message?.toLowerCase().includes('secure')) {
          reject(new Error('ক্যানভাস এক্সপোর্ট সিকিউরিটি এরর (CORS Taint): কোনো বাহ্যিক ইমেজ রিসোর্স (যেমন ফিচার্ড ইমেজ বা লোগো) CORS নীতি বা নিরাপত্তা লঙ্ঘন করেছে। দয়া করে নিশ্চিত করুন সবগুলো ছবি সঠিক সিকিউর প্রক্সির মাধ্যমে লোড হয়েছে।'));
        } else {
          reject(new Error(`ক্যানভাস ব্লব তৈরিতে ব্যর্থতা: ${e.message}`));
        }
      }
    });
  }
}
