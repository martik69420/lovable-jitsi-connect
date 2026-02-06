
import React, { useEffect, useRef, useState, Component, ReactNode } from 'react';

// Add window.adsbygoogle type declaration
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

// Error boundary to prevent ads from crashing the app
class AdErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('AdBanner error caught:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return null; // Silently fail - don't break the page
    }
    return this.props.children;
  }
}

interface AdBannerProps {
  adSlot: string;
  adFormat?: string;
  className?: string;
}

const AdBannerContent: React.FC<AdBannerProps> = ({ 
  adSlot,
  adFormat = 'auto',
  className = 'w-full overflow-hidden my-4'
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const adKey = useRef(`ad-${Math.random().toString(36).substring(2, 9)}`);
  const initialized = useRef(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show ad after component mounts to avoid SSR issues
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!isVisible || !adRef.current || initialized.current) return;

    // Check if adsbygoogle is available
    if (typeof window === 'undefined' || !window.adsbygoogle) {
      return;
    }

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      // Additional check for container width
      if (!adRef.current || adRef.current.clientWidth === 0) {
        return;
      }

      try {
        adRef.current.setAttribute('data-ad-key', adKey.current);
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initialized.current = true;
      } catch (error) {
        console.warn("AdSense initialization skipped:", error);
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [adSlot, isVisible]);

  if (!isVisible) return null;

  return (
    <div className={className} style={{ minHeight: '50px' }}>
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

const AdBanner: React.FC<AdBannerProps> = (props) => {
  return (
    <AdErrorBoundary>
      <AdBannerContent {...props} />
    </AdErrorBoundary>
  );
};

export default AdBanner;
