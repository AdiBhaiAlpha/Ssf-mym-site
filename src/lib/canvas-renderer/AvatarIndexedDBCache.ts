export class AvatarIndexedDBCache {
  private static dbName = 'MemberAvatarCacheDB';
  private static storeName = 'avatar-cache';
  private static dbVersion = 1;
  private static db: IDBDatabase | null = null;
  private static sessionBlobUrls: Map<string, string> = new Map();

  /**
   * Initializes the IndexedDB database.
   */
  public static init(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);

    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'url' });
          }
        };

        request.onsuccess = (event: any) => {
          this.db = event.target.result;
          resolve(this.db!);
        };

        request.onerror = (event: any) => {
          console.error('[AvatarIndexedDBCache] Open DB error:', event.target.error);
          reject(event.target.error);
        };
      } catch (err) {
        console.error('[AvatarIndexedDBCache] IndexedDB not supported or blocked:', err);
        reject(err);
      }
    });
  }

  /**
   * Retrieves a cached image URL (as a same-origin Blob URL).
   * If not cached, returns null.
   */
  public static async get(url: string | undefined): Promise<string | null> {
    if (!url) return null;
    if (url.startsWith('data:')) return url; // Already base64

    // Check memory cache first to avoid re-creating object URLs
    if (this.sessionBlobUrls.has(url)) {
      return this.sessionBlobUrls.get(url)!;
    }

    try {
      await this.init();
      if (!this.db) return null;

      const entry = await new Promise<any>((resolve, reject) => {
        const transaction = this.db!.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(url);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (entry && entry.blob) {
        const blobUrl = URL.createObjectURL(entry.blob);
        this.sessionBlobUrls.set(url, blobUrl);
        console.log(`[AvatarIndexedDBCache] Cache HIT for: ${url}`);
        return blobUrl;
      }
    } catch (err) {
      console.warn('[AvatarIndexedDBCache] Failed to get from cache:', err);
    }

    return null;
  }

  /**
   * Fetches an image, caches it in IndexedDB as a Blob, and returns a same-origin Blob URL.
   */
  public static async fetchAndCache(url: string | undefined): Promise<string> {
    if (!url) return '';
    if (url.startsWith('data:')) return url;

    // Check if we already have it in memory or indexedDB
    const cached = await this.get(url);
    if (cached) return cached;

    const isExternal = url.startsWith('http://') || url.startsWith('https://');
    const fetchUrl = isExternal
      ? `/api/proxy-image?url=${encodeURIComponent(url)}`
      : url;

    try {
      console.log(`[AvatarIndexedDBCache] Cache MISS. Fetching and caching: ${url}`);
      const response = await fetch(fetchUrl, { credentials: 'omit' });
      if (!response.ok) {
        throw new Error(`Failed to fetch image: status ${response.status}`);
      }

      const blob = await response.blob();
      
      // Save to IndexedDB
      await this.init();
      if (this.db) {
        await new Promise<void>((resolve, reject) => {
          const transaction = this.db!.transaction(this.storeName, 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.put({
            url,
            blob,
            contentType: blob.type,
            timestamp: Date.now()
          });

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        console.log(`[AvatarIndexedDBCache] Successfully cached image to IndexedDB: ${url}`);
      }

      // Create blob URL for immediate use
      const blobUrl = URL.createObjectURL(blob);
      this.sessionBlobUrls.set(url, blobUrl);
      return blobUrl;
    } catch (err) {
      console.warn(`[AvatarIndexedDBCache] Failed to fetch and cache image for ${url}:`, err);
      // Fallback to proxy URL directly
      return fetchUrl;
    }
  }

  /**
   * Explicitly saves a Blob or Base64 string directly to IndexedDB.
   */
  public static async put(url: string, blob: Blob): Promise<void> {
    if (!url || url.startsWith('data:')) return;

    try {
      await this.init();
      if (this.db) {
        await new Promise<void>((resolve, reject) => {
          const transaction = this.db!.transaction(this.storeName, 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.put({
            url,
            blob,
            contentType: blob.type,
            timestamp: Date.now()
          });

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        
        // Update session map
        if (this.sessionBlobUrls.has(url)) {
          URL.revokeObjectURL(this.sessionBlobUrls.get(url)!);
        }
        const blobUrl = URL.createObjectURL(blob);
        this.sessionBlobUrls.set(url, blobUrl);
        console.log(`[AvatarIndexedDBCache] Explicitly put image in IndexedDB: ${url}`);
      }
    } catch (err) {
      console.warn('[AvatarIndexedDBCache] Failed to save in put():', err);
    }
  }

  /**
   * Clear all items in the IndexedDB cache
   */
  public static async clearCache(): Promise<void> {
    try {
      await this.init();
      if (this.db) {
        await new Promise<void>((resolve, reject) => {
          const transaction = this.db!.transaction(this.storeName, 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.clear();

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
      // Revoke and clear session URLs
      for (const blobUrl of this.sessionBlobUrls.values()) {
        URL.revokeObjectURL(blobUrl);
      }
      this.sessionBlobUrls.clear();
      console.log('[AvatarIndexedDBCache] Cache cleared successfully');
    } catch (err) {
      console.error('[AvatarIndexedDBCache] Failed to clear cache:', err);
    }
  }
}
