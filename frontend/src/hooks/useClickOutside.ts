import { useEffect, useRef } from 'react';

/**
 * Hook that detects clicks outside of a component
 * Useful for dropdowns, modals, and tooltips
 */
const useClickOutside = <T extends HTMLElement = HTMLElement>(
  handler: () => void
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handler]);

  return ref;
};

export default useClickOutside;