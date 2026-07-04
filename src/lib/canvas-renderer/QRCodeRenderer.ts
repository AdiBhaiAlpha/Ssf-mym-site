import QRCode from 'qrcode';

export class QRCodeRenderer {
  /**
   * Generates a high-resolution sharp QR code image and draws it onto the canvas
   */
  public static async drawQRCode(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    size: number,
    fgColor = '#000000',
    bgColor = '#ffffff'
  ): Promise<void> {
    try {
      // Create a temporary canvas with high resolution for sharpness
      const tempCanvas = document.createElement('canvas');
      const scaleFactor = 4; // Render 4x larger for vector-like quality
      const renderSize = size * scaleFactor;
      
      tempCanvas.width = renderSize;
      tempCanvas.height = renderSize;

      await QRCode.toCanvas(tempCanvas, text, {
        margin: 1,
        width: renderSize,
        color: {
          dark: fgColor,
          light: bgColor
        },
        errorCorrectionLevel: 'H'
      });

      // Draw onto target canvas with original size (high DPI is handled by the browser's scale/transform)
      ctx.drawImage(tempCanvas, x, y, size, size);
    } catch (e) {
      console.error('Failed to generate/draw QR code:', e);
      // Fallback: simple placeholder box with text
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = fgColor;
      ctx.strokeRect(x, y, size, size);
      ctx.fillStyle = fgColor;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('QR Error', x + size / 2, y + size / 2);
    }
  }
}
