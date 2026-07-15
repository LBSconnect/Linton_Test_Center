import { useEffect } from 'react';
import { useLocation } from 'wouter';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
let gaReady = false;

export default function Analytics() {
  const [location] = useLocation();

  useEffect(() => {
    if (!GA_ID || gaReady) return;
    gaReady = true;

    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { send_page_view: false });
  }, []);

  useEffect(() => {
    if (!GA_ID || !window.gtag) return;
    window.gtag('event', 'page_view', { page_path: location });
  }, [location]);

  return null;
}
