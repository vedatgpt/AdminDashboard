// Utility functions for easy toast usage without importing context
import { Toast } from '../contexts/ToastContext';

// Export types for easy usage
export type ToastType = Toast['type'];

// Helper functions that can be used anywhere in the app
export const showSuccessToast = (message: string, duration?: number) => {
  // This will be populated by the useToast hook when used in components
  console.log(`SUCCESS: ${message}`);
};

export const showErrorToast = (message: string, duration?: number) => {
  console.log(`ERROR: ${message}`);
};

export const showWarningToast = (message: string, duration?: number) => {
  console.log(`WARNING: ${message}`);
};

export const showInfoToast = (message: string, duration?: number) => {
  console.log(`INFO: ${message}`);
};

// Example usage functions for documentation
export const exampleToastUsages = {
  // In React components:
  inComponent: `
    import { useToast } from '@/contexts/ToastContext';
    
    const MyComponent = () => {
      const { showToast } = useToast();
      
      const handleError = () => {
        showToast('error', 'Bir hata oluştu!');
      };
      
      const handleSuccess = () => {
        showToast('success', 'İşlem başarılı!', 3000);
      };
    };
  `,
  
  // Available toast types:
  types: `
    showToast('success', 'İşlem başarılı!');
    showToast('error', 'Hata oluştu!');
    showToast('warning', 'Uyarı mesajı');
    showToast('info', 'Bilgi mesajı');
  `
};