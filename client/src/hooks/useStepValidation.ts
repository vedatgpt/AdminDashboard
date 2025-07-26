import { useEffect } from 'react';
import { useLocation } from 'wouter';
// Preline UI uyumlu alert sistemi için basit alert
import { validateStepAccess, getStepFromPath } from '@/utils/stepValidation';
import { DraftListing } from '@shared/schema';

interface UseStepValidationProps {
  draftData: DraftListing | null;
  isDraftLoading: boolean;
  classifiedId: string | null;
}

export const useStepValidation = ({ 
  draftData, 
  isDraftLoading, 
  classifiedId 
}: UseStepValidationProps) => {
  const [location, navigate] = useLocation();

  useEffect(() => {
    // Loading sırasında validation yapma
    if (isDraftLoading) return;

    // classifiedId yoksa Step 1'e yönlendir
    if (!classifiedId) {
      if (!location.includes('/create-listing/step-1')) {
        navigate('/create-listing/step-1');
      }
      return;
    }

    const currentStep = getStepFromPath(location);
    const validation = validateStepAccess(currentStep, draftData);

    if (!validation.isValid && validation.redirectTo) {
      // Alert mesajı göster
      if (validation.message) {
        alert(`Erişim Engellendi: ${validation.message}`);
      }

      // Doğru step'e yönlendir
      const redirectPath = `/create-listing/step-${validation.redirectTo}${classifiedId ? `?classifiedId=${classifiedId}` : ''}`;
      navigate(redirectPath);
    }
  }, [location, draftData, classifiedId, navigate]);
};