import { useState, useEffect } from 'react';

export function useOS() {
  const [os, setOs] = useState<string | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Win/i.test(ua)) setOs('Windows');
    else if (/Mac/i.test(ua)) setOs('macOS');
    else if (/Linux/i.test(ua)) setOs('Linux');
    else if (/Android/i.test(ua)) setOs('Android');
    else if (/like Mac/i.test(ua)) setOs('iOS');
  }, []);

  return os;
}