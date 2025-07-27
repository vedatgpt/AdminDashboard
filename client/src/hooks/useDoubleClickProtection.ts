import { useState, useCallback } from 'react';

interface UseDoubleClickProtectionReturn {
  isSubmitting: boolean;
  executeWithProtection: (fn: () => Promise<void> | void) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for preventing double-click actions
 * Provides loading state and execution wrapper for any async function
 */
export const useDoubleClickProtection = (): UseDoubleClickProtectionReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const executeWithProtection = useCallback(async (fn: () => Promise<void> | void) => {
    // Early exit if already submitting
    if (isSubmitting) {
      console.log('🚫 Double-click prevented - already submitting');
      return;
    }

    // Set loading state immediately
    setIsSubmitting(true);

    try {
      // Execute the provided function
      await fn();
    } catch (error) {
      console.error('Protected function execution error:', error);
      throw error; // Re-throw to allow caller to handle
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  const reset = useCallback(() => {
    setIsSubmitting(false);
  }, []);

  return {
    isSubmitting,
    executeWithProtection,
    reset
  };
};