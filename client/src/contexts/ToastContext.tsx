import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  timestamp?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: Toast['type'], message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: Toast['type'], message: string, duration: number = 5000) => {
    const now = Date.now();
    
    // SMART DUPLICATE PREVENTION: 
    // - For file validation errors: Allow re-showing after 3 seconds
    // - For other messages: Prevent duplicates completely
    const existingToast = toasts.find(toast => toast.message === message && toast.type === type);
    if (existingToast) {
      const timeSinceLastShown = now - (existingToast.timestamp || 0);
      const isFileValidationError = message.includes('HEIC') || message.includes('desteklenmemektedir') || message.includes('formatı');
      
      if (isFileValidationError && timeSinceLastShown > 3000) {
        // Allow file validation errors to re-show after 3 seconds
        console.log('✅ File validation toast re-shown after 3s:', message);
      } else {
        console.log('🚫 Duplicate toast prevented:', message);
        return; // Don't show duplicate toast
      }
    }

    // LIMIT TOAST COUNT: Maximum 3 toasts at once
    if (toasts.length >= 3) {
      console.log('🚫 Toast limit reached, removing oldest toast');
      setToasts(prev => prev.slice(1)); // Remove oldest toast
    }

    const id = Math.random().toString(36).substring(2, 15);
    const newToast: Toast = { id, type, message, duration, timestamp: now };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove toast after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [toasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};