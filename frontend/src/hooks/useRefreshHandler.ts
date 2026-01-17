// src/hooks/useModalRefreshHandler.ts
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export const useModalRefreshHandler = (onClose: () => void) => {
  const router = useRouter();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // Mark that we're opening via navigation (not refresh)
    sessionStorage.setItem('mOpen', 'true');

    const handleBeforeUnload = () => {
      sessionStorage.setItem('mOpen', 'true');
    };

    const checkIfRefreshed = () => {
      // Check if modal was NOT opened via navigation
      const openedViaNav = sessionStorage.getItem('mOpen');
      
      // Check if refresh was detected
      const refreshDetected = sessionStorage.getItem('mOpen');
      
      if (!openedViaNav || refreshDetected) {
        return true;
      }

      // Check navigation type using Performance API
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries.length > 0 && navEntries[0].type === 'reload') {
        return true;
      }

      return false;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      
      if (checkIfRefreshed()) {
        console.log('Modal page was refreshed, redirecting back...');
        // Use setTimeout to ensure router is ready
        setTimeout(() => {
          router.back();
        }, 100);
        return;
      }
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sessionStorage.removeItem('mOpen');
      sessionStorage.removeItem('mOpen');
    };
  }, [router, onClose]);
};