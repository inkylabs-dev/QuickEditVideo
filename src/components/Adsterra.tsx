"use client";

import { useEffect } from 'react';

const Adsterra = () => {
  const shouldShowAds =
    process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ADSTERRA_ENABLED === 'true';

  useEffect(() => {
    if (!shouldShowAds) return;

    if (document.getElementById('adsterra-script')) return;

    const script = document.createElement('script');
    script.setAttribute('async', 'true');
    script.setAttribute('data-cfasync', 'false');
    script.id = 'adsterra-script';
    script.src = 'https://pl27432156.profitableratecpm.com/dcd98c5173d8cb7b028f645ea697ef2f/invoke.js';
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [shouldShowAds]);

  if (!shouldShowAds) return null;

  return <div id="container-dcd98c5173d8cb7b028f645ea697ef2f"></div>;
};

export default Adsterra;
