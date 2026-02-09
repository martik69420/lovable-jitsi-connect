
import React, { useEffect, useRef } from 'react';

// Add window.adsbygoogle type declaration
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdBannerProps {
  adSlot: string;
  adFormat?: string;
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ 
  adSlot,
  adFormat = 'auto',
  className = 'w-full overflow-hidden my-4'
}) => {
  // Create a ref with any type to avoid TypeScript errors with the ins element
  const adRef = useRef<any>(null);
  const adKey = useRef(`ad-${Math.random().toString(36).substring(2, 9)}`);
  const initialized = useRef(false);

  useEffect(() => {
    // Only initialize once and when the ref is available
    if (adRef.current && !initialized.current && window.adsbygoogle) {
      try {
        // Add a unique key to prevent duplicate initialization
        adRef.current.setAttribute('data-ad-key', adKey.current);
        
        // Push the ad with a slight delay to ensure DOM is ready
        const timer = setTimeout(() => {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            initialized.current = true;
          } catch (error) {
            console.error("AdSense delayed initialization error:", error);
          }
        }, 100);
        
        return () => clearTimeout(timer);
      } catch (error) {
        console.error("AdSense initialization error:", error);
      }
    }
    
    return () => {
      // Reset on unmount
      initialized.current = false;
    };
  }, [adSlot]);

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-2400753081350870"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
        ref={adRef}
        key={adKey.current}
      />
    </div>
  );
};

export default AdBanner;
