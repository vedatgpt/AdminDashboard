import { useMemo } from 'react';

/**
 * Custom hook to extract classifiedId from URL parameters
 * @returns The classifiedId as number or undefined
 */
export const useClassifiedId = (): number | undefined => {
  return useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const classifiedIdParam = urlParams.get('classifiedId');
    return classifiedIdParam ? parseInt(classifiedIdParam) : undefined;
  }, []);
}; 