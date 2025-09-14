
import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

interface UseImageOptions {
  mobileSrc?: string;
  desktopSrc?: string;
  defaultSrc: string;
  lowQualitySrc?: string;
  lazyLoad?: boolean;
}

export function useResponsiveImage({
  mobileSrc,
  desktopSrc,
  defaultSrc,
  lowQualitySrc,
  lazyLoad = true,
}: UseImageOptions) {
  const [src, setSrc] = useState<string>(lowQualitySrc || defaultSrc);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const img = new Image();
    const sourceSrc = isMobile && mobileSrc ? mobileSrc : (desktopSrc || defaultSrc);
    
    if (lowQualitySrc && !isLoaded) {
      setSrc(lowQualitySrc);
    }

    if (lazyLoad) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              img.src = sourceSrc;
              img.onload = () => {
                setSrc(sourceSrc);
                setIsLoaded(true);
              };
              img.onerror = () => {
                setSrc(defaultSrc);
                setError(true);
              };
              observer.disconnect();
            }
          });
        },
        { rootMargin: '200px 0px' }
      );
      
      observer.observe(document.getElementById('root') as Element);
      return () => {
        observer.disconnect();
      };
    } else {
      img.src = sourceSrc;
      img.onload = () => {
        setSrc(sourceSrc);
        setIsLoaded(true);
      };
      img.onerror = () => {
        setSrc(defaultSrc);
        setError(true);
      };
    }
  }, [isMobile, mobileSrc, desktopSrc, defaultSrc, lowQualitySrc, lazyLoad, isLoaded]);

  return {
    src,
    isLoaded,
    error,
  };
}

export function useImagePreload(srcArray: string[]) {
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    srcArray.forEach((src) => {
      const img = new Image();
      
      img.onload = () => {
        setLoadedImages((prev) => [...prev, src]);
      };
      
      img.onerror = () => {
        setErrors((prev) => [...prev, src]);
      };
      
      img.src = src;
    });
  }, [srcArray]);

  return {
    loadedImages,
    allLoaded: loadedImages.length + errors.length === srcArray.length,
    errors,
  };
}
