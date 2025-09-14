
import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect if the current viewport is mobile-sized
 * @returns boolean indicating if the viewport width is below the mobile breakpoint
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [initialized, setInitialized] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      if (!initialized) setInitialized(true)
    }
    
    // Initial check
    checkMobile()
    
    // Add listener for window resize
    window.addEventListener("resize", checkMobile)
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", checkMobile)
  }, [initialized])

  // During server-side rendering or before initialization,
  // assume desktop first for better SEO
  return initialized ? isMobile : false
}

/**
 * Detects if the device is a touch device
 * @returns boolean indicating if the device supports touch
 */
export function useTouchDevice() {
  const [isTouch, setIsTouch] = React.useState(false)
  
  React.useEffect(() => {
    const isTouchDevice = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0

    setIsTouch(isTouchDevice)
  }, [])
  
  return isTouch
}

/**
 * Combined hook that provides device type detection for responsive UIs
 * @returns Object containing isMobile, isTouch, and isDesktop flags
 */
export function useDeviceDetection() {
  const isMobile = useIsMobile()
  const isTouch = useTouchDevice()
  
  return {
    isMobile,
    isTouch,
    isDesktop: !isMobile && !isTouch
  }
}
