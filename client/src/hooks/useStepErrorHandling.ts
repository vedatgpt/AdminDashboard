import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from './use-toast';

interface UseStepErrorHandlingProps {
  isDraftError: boolean;
  draftError: any;
  currentClassifiedId: number | null;
}

/**
 * Common error handling hook for draft access errors
 * Handles the repeated error handling pattern for unauthorized draft access
 */
export function useStepErrorHandling({ 
  isDraftError, 
  draftError, 
  currentClassifiedId 
}: UseStepErrorHandlingProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (isDraftError && draftError && currentClassifiedId) {
      console.error('🚨 SECURITY: Unauthorized draft access attempt:', currentClassifiedId);

      // 403 Forbidden: Başka kullanıcının draft'ına erişim - Güvenlik ihlali
      if (draftError.message?.includes('erişim yetkiniz yok')) {
        console.error('🚨 SECURITY VIOLATION: User attempted to access another user\'s draft');
        toast({
          title: "Güvenlik Hatası", 
          description: "İlgili ilan için yetkiniz bulunmamaktadır.",
          variant: "destructive"
        });
        navigate('/create-listing/step-1');
      } 
      // 404 Not Found: Hiç var olmayan draft ID - Normal akış
      else if (draftError.message?.includes('bulunamadı')) {
        // Toast gösterme, sadece Step1'e yönlendir
        navigate('/create-listing/step-1');
      }
      // Diğer hatalar
      else {
        navigate('/create-listing/step-1');
      }
    }
  }, [isDraftError, draftError, currentClassifiedId, navigate, toast]);
} 