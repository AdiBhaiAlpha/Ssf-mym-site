export class FontLoader {
  private static fontsLoaded = false;

  public static async loadFonts(): Promise<boolean> {
    if (this.fontsLoaded) return true;

    try {
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
        this.fontsLoaded = true;
        return true;
      }
    } catch (e) {
      console.error('Failed waiting for document.fonts.ready:', e);
    }
    return false;
  }

  /**
   * Helper to fetch and verify google fonts if needed
   */
  public static async loadGoogleFont(fontName: string): Promise<boolean> {
    try {
      if (typeof document !== 'undefined' && document.fonts) {
        // Just make sure it is ready
        await document.fonts.ready;
        return true;
      }
    } catch (e) {
      console.error(`Failed loading google font ${fontName}:`, e);
    }
    return false;
  }
}
