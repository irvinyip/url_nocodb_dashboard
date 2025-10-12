'use client';

import { useEffect } from 'react';

export default function BootstrapClient() {
  useEffect(() => {
    // Import Bootstrap JavaScript - ignore TypeScript error for now
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return null;
}