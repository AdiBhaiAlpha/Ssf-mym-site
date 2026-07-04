import { useState, useEffect } from 'react';
import { AvatarIndexedDBCache } from './AvatarIndexedDBCache';

export function useCachedAvatar(url: string | undefined): string {
  const [resolvedUrl, setResolvedUrl] = useState<string>('');

  useEffect(() => {
    if (!url) {
      setResolvedUrl('');
      return;
    }

    if (url.startsWith('data:')) {
      setResolvedUrl(url);
      return;
    }

    let isMounted = true;

    async function loadAvatar() {
      try {
        // Try to fetch from IndexedDB or fetch and cache it
        const cachedUrl = await AvatarIndexedDBCache.fetchAndCache(url);
        if (isMounted) {
          setResolvedUrl(cachedUrl);
        }
      } catch (err) {
        console.warn('[useCachedAvatar] Failed to load cached avatar, falling back to direct proxy url', err);
        if (isMounted) {
          const proxied = url.startsWith('http') && !url.includes('api/proxy-image')
            ? `/api/proxy-image?url=${encodeURIComponent(url)}`
            : url;
          setResolvedUrl(proxied);
        }
      }
    }

    loadAvatar();

    return () => {
      isMounted = false;
    };
  }, [url]);

  return resolvedUrl;
}
