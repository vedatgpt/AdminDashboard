// Simple toast implementation for migration from shadcn to Preline UI
export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const toast = ({ title, description, variant }: ToastProps) => {
    // Simple browser alert for now - will be replaced with Preline UI notifications later
    const message = title ? (description ? `${title}: ${description}` : title) : description || '';
    if (variant === 'destructive') {
      alert(`Hata: ${message}`);
    } else {
      alert(`Başarılı: ${message}`);
    }
  };

  return { toast };
}