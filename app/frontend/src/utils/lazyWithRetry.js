import { lazy } from 'react';

/**
 * Resilient lazy loader for React route components.
 * Automatically recovers from chunk load failures caused by new deployments
 * where chunk hashes change on the remote host (e.g. Vercel / Netlify).
 */
export function lazyWithRetry(componentImport) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      const msg = (error?.message || '').toLowerCase();
      const isChunkError =
        msg.includes('failed to fetch dynamically imported module') ||
        msg.includes('chunkloaderror') ||
        msg.includes('loading chunk') ||
        msg.includes('failed to load module script') ||
        msg.includes('text/html');

      if (isChunkError && typeof window !== 'undefined') {
        const lastReload = sessionStorage.getItem('telemed_chunk_reload');
        const now = Date.now();
        // Allow automatic recovery reload once every 12 seconds
        if (!lastReload || now - parseInt(lastReload, 10) > 12000) {
          sessionStorage.setItem('telemed_chunk_reload', String(now));
          console.warn('[TeleMed] Dynamic chunk mismatch detected. Auto-reloading page to fetch latest deployment...');
          window.location.reload();
          // Return a pending promise to prevent throwing while the browser is reloading
          return new Promise(() => {});
        }
      }
      throw error;
    }
  });
}
