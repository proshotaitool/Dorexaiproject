
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const PREVIEW_KEY = 'proshot-ai-preview-mode';

export function usePreviewMode() {
  const router = useRouter();
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    // This effect runs on the client and checks sessionStorage
    const checkPreviewStatus = () => {
      const storedValue = sessionStorage.getItem(PREVIEW_KEY);
      setIsPreviewing(storedValue === 'true');
    };

    checkPreviewStatus();
    
    // Listen for storage changes in other tabs (optional but good practice)
    window.addEventListener('storage', checkPreviewStatus);
    return () => {
      window.removeEventListener('storage', checkPreviewStatus);
    };
  }, []);

  const enterPreviewMode = useCallback(() => {
    sessionStorage.setItem(PREVIEW_KEY, 'true');
    setIsPreviewing(true);
    router.push('/'); // Navigate to homepage to start preview
  }, [router]);

  const exitPreviewMode = useCallback(() => {
    sessionStorage.removeItem(PREVIEW_KEY);
    setIsPreviewing(false);
    // Refresh to clear any session-based state and show admin view
    window.location.reload();
  }, []);

  return { isPreviewing, enterPreviewMode, exitPreviewMode };
}
