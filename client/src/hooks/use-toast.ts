// Preline UI toast implementation
export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const toast = ({ title, description, variant }: ToastProps) => {
    // Using native browser notifications with Preline UI styling
    const message = title ? (description ? `${title}: ${description}` : title) : description || '';
    
    // Create a simple toast notification
    const toastEl = document.createElement('div');
    toastEl.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
      variant === 'destructive' 
        ? 'bg-red-500 text-white' 
        : 'bg-green-500 text-white'
    }`;
    toastEl.textContent = message;
    
    document.body.appendChild(toastEl);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toastEl.remove();
    }, 3000);
  };

  return { toast };
}