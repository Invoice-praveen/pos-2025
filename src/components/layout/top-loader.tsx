
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({ showSpinner: false });

    const handleStart = () => NProgress.start();
    const handleStop = () => NProgress.done();

    // We need to use a combination of pathname and searchParams
    // to accurately detect URL changes for NProgress.
    // The router events from 'next/router' (like routeChangeStart) are not
    // directly available in the App Router in the same way.
    // Instead, we trigger NProgress based on changes to pathname or searchParams.

    // Start NProgress on initial load or when pathname/searchParams change
    handleStart();
    
    // Stop NProgress. This will effectively happen on the next render cycle
    // after the new page component has mounted.
    // For a smoother effect, we can use a small delay or rely on NProgress's own easing.
    // NProgress.done() has its own internal logic to complete gracefully.
    handleStop(); 


    // This effect should re-run whenever pathname or searchParams change,
    // effectively starting and stopping NProgress for each navigation.
  }, [pathname, searchParams]);

  // This component doesn't render anything itself
  return null;
}
