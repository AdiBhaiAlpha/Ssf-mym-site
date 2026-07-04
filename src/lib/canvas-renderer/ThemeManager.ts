export interface ThemeConfig {
  bgColor: string;
  bgGradientStart?: string;
  bgGradientEnd?: string;
  textColor: string;
  secondaryTextColor: string;
  borderColor: string;
  accentColor: string;
  cardBg: string;
}

export class ThemeManager {
  public static getTheme(theme: 'light' | 'dark' | 'cream', accentColor: string): ThemeConfig {
    switch (theme) {
      case 'dark':
        return {
          bgColor: '#090d16',
          bgGradientStart: '#090d16',
          bgGradientEnd: '#1a1424',
          textColor: '#ffffff',
          secondaryTextColor: '#94a3b8',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          accentColor: accentColor,
          cardBg: '#111827'
        };
      case 'cream':
        return {
          bgColor: '#fdfbf7',
          bgGradientStart: '#fdfbf7',
          bgGradientEnd: '#f5efe6',
          textColor: '#1c1917',
          secondaryTextColor: '#57534e',
          borderColor: '#e7e5e4',
          accentColor: accentColor,
          cardBg: '#fafaf9'
        };
      case 'light':
      default:
        return {
          bgColor: '#ffffff',
          bgGradientStart: '#ffffff',
          bgGradientEnd: '#f1f5f9',
          textColor: '#0f172a',
          secondaryTextColor: '#475569',
          borderColor: '#e2e8f0',
          accentColor: accentColor,
          cardBg: '#ffffff'
        };
    }
  }

  public static drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    theme: 'light' | 'dark' | 'cream',
    style: string, // 'solid' | 'gradient' | 'noise' | 'geometric' | 'paper'
    config: ThemeConfig
  ) {
    ctx.save();

    // 1. Fill base color or gradient
    if (style === 'gradient' && config.bgGradientStart && config.bgGradientEnd) {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, config.bgGradientStart);
      grad.addColorStop(1, config.bgGradientEnd);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = config.bgColor;
    }
    ctx.fillRect(0, 0, width, height);

    // 2. Add style effects
    if (style === 'paper' || theme === 'cream') {
      // Vintage paper fibers effect
      ctx.fillStyle = 'rgba(139, 92, 26, 0.015)';
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const w = 5 + Math.random() * 25;
        const h = 1 + Math.random() * 2;
        ctx.fillRect(x, y, w, h);
      }
    } else if (style === 'noise') {
      // Noise overlay
      ctx.fillStyle = 'rgba(0,0,0,0.02)';
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    } else if (style === 'geometric') {
      // Subtle grid pattern
      ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Add big subtle circle accent
      ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.01)';
      ctx.beginPath();
      ctx.arc(width * 0.8, height * 0.2, 300, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  public static drawBorder(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    borderStyle: string,
    accentColor: string,
    borderColor: string
  ) {
    if (borderStyle === 'none') return;

    ctx.save();
    ctx.lineWidth = 12;

    if (borderStyle === 'double') {
      ctx.strokeStyle = accentColor;
      ctx.strokeRect(10, 10, width - 20, height - 20);
      ctx.lineWidth = 4;
      ctx.strokeStyle = borderColor;
      ctx.strokeRect(22, 22, width - 44, height - 44);
    } else if (borderStyle === 'vintage') {
      // Vintage frame with inner inset border
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 8;
      ctx.strokeRect(15, 15, width - 30, height - 30);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(25, 25, width - 50, height - 50);
    } else if (borderStyle === 'neon-glow') {
      // Neon glow border
      ctx.strokeStyle = accentColor;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 15;
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, width - 20, height - 20);
    } else if (borderStyle === 'thin-red') {
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, width - 12, height - 12);
    } else {
      ctx.strokeStyle = borderColor;
      ctx.strokeRect(10, 10, width - 20, height - 20);
    }

    ctx.restore();
  }
}
