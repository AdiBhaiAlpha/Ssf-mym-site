import { AssetCache } from './AssetCache';

export class RetryManager {
  /**
   * Executes a rendering operation with up to 3 automated retry attempts.
   * If a failure occurs, it clears memory/asset caches, re-initializes, and retries.
   */
  public static async executeWithRetry<T>(
    renderFn: (attempt: number) => Promise<T>,
    maxAttempts = 3,
    onRetry?: (attempt: number, error: any) => void
  ): Promise<T> {
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[RetryManager] Execution attempt #${attempt} of ${maxAttempts}...`);
        const result = await renderFn(attempt);
        console.log(`[RetryManager] Execution succeeded on attempt #${attempt}`);
        return result;
      } catch (error: any) {
        lastError = error;
        console.error(`[RetryManager] Attempt #${attempt} failed with error:`, error);

        if (attempt < maxAttempts) {
          // Clear internal caches before retrying to resolve asset loading issues
          console.log(`[RetryManager] Resetting AssetCache and preparing for retry #${attempt + 1}...`);
          AssetCache.clear();
          
          if (onRetry) {
            onRetry(attempt, error);
          }
          
          // Delay slightly before retrying (exponential backoff)
          const delayMs = attempt * 300;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new Error(`রেন্ডারিং পাইপলাইন ${maxAttempts} বার চেষ্টা করার পরও ব্যর্থ হয়েছে।`);
  }
}
