
import * as React from "react"

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Aligné sur les breakpoints Tailwind
const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

export function useBreakpoint(breakpoint: Breakpoint) {
  const [isAboveBreakpoint, setIsAboveBreakpoint] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= breakpoints[breakpoint];
  });

  React.useEffect(() => {
    const checkBreakpoint = () => {
      setIsAboveBreakpoint(window.innerWidth >= breakpoints[breakpoint]);
    };

    // Add event listener with debounce for better performance
    let timeoutId: number | undefined;
    const handleResize = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(checkBreakpoint, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial check
    checkBreakpoint();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [breakpoint]);

  return isAboveBreakpoint;
}

// IMPORTANT: cette fonction retourne "true" pour mobile, ce qui est l'inverse de celle dans use-media-query.ts
export function useIsMobile() {
  return !useBreakpoint('md'); // Consider anything below 'md' (768px) as mobile
}
