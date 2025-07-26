import { useEffect } from "react";
import { useLocation } from "wouter";
import { DraftListing } from "@shared/schema";
import { 
  validateStep1, 
  validateStep2, 
  validateStep3, 
  validateStep4,
  StepValidationResult 
} from "@/utils/stepValidation";

// Helper function to get validation for specific step
function getValidationForStep(step: number, draft: DraftListing | null): StepValidationResult {
  switch (step) {
    case 1:
      return validateStep1(draft);
    case 2:
      return validateStep2(draft);
    case 3:
      return validateStep3(draft);
    case 4:
      return validateStep4(draft);
    default:
      return validateStep1(draft);
  }
}

// Helper function to get redirect path
function getRedirectPath(classifiedId: string, targetStep: number): string {
  const basePath = "/create-listing";
  const queryParam = `?classifiedId=${classifiedId}`;
  
  switch (targetStep) {
    case 1:
      return `${basePath}/step-1${queryParam}`;
    case 2:
      return `${basePath}/step-2${queryParam}`;
    case 3:
      return `${basePath}/step-3${queryParam}`;
    case 4:
      return `${basePath}/step-4${queryParam}`;
    default:
      return `${basePath}/step-1${queryParam}`;
  }
}

// Router Guard hook for step-based navigation protection
// DISABLED: Server-side Router Guard handles all security validation
export function useStepGuard(
  currentStep: number,
  classifiedId: string | null,
  draft: DraftListing | null,
  isLoading: boolean = false
) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // CLIENT-SIDE ROUTER GUARD DISABLED
    // Server-side middleware in routes.ts handles all security validation
    // This prevents infinite loop conflicts between client and server guards
    console.log(`ℹ️ CLIENT GUARD DISABLED: Server-side Guard handles Step ${currentStep} security`);
    return;
    
    // All original validation logic commented out to prevent conflicts
    /*
    // CRITICAL: Skip validation ONLY if still loading
    if (isLoading) {
      console.log(`🔄 STEP ${currentStep} GUARD: Skipping validation - still loading`);
      return;
    }

    // SECURITY FIX: If no classifiedId, redirect to Step1 (except for Step1 itself)
    if (!classifiedId && currentStep !== 1) {
      console.warn(`🚨 STEP ${currentStep} GUARD: No classifiedId found, redirecting to Step 1`);
      setLocation('/create-listing/step-1');
      return;
    }

    // SECURITY FIX: If no draft found and not Step1, redirect to Step1
    if (!draft && currentStep !== 1) {
      console.warn(`🚨 STEP ${currentStep} GUARD: No draft found, redirecting to Step 1`);
      setLocation('/create-listing/step-1');
      return;
    }

    // Skip validation for Step1 (it creates its own draft)
    if (currentStep === 1) {
      console.log(`✅ STEP 1 GUARD: Validation skipped - Step1 manages its own draft`);
      return;
    }

    // CRITICAL FIX: Actually perform step validation!
    console.log(`🔍 STEP ${currentStep} GUARD: Performing validation check...`);
    const validationResult = getValidationForStep(currentStep, draft);
    
    console.log(`🔍 STEP ${currentStep} VALIDATION RESULT:`, {
      isValid: validationResult.isValid,
      missingFields: validationResult.missingFields,
      redirectStep: validationResult.redirectStep,
      draftStep1: draft?.step1Completed,
      draftStep2: draft?.step2Completed,
      draftStep3: draft?.step3Completed
    });

    if (!validationResult.isValid && validationResult.redirectStep) {
      // Redirect to appropriate step with error feedback
      const redirectPath = getRedirectPath(classifiedId!, validationResult.redirectStep);
      
      // Show user-friendly error message
      console.warn(`🚨 STEP ${currentStep} VALIDATION FAILED:`, validationResult.missingFields);
      console.warn(`🔄 REDIRECTING TO: ${redirectPath}`);
      
      // IMMEDIATE REDIRECT - Remove timeout for instant security protection
      console.warn(`🚨 SECURITY REDIRECT EXECUTING NOW!`);
      setLocation(redirectPath);
      
      // Also try window.location as backup for absolute security
      if (typeof window !== 'undefined') {
        console.warn(`🚨 BACKUP REDIRECT: Using window.location.replace`);
        window.location.replace(redirectPath);
      }
    } else {
      console.log(`✅ STEP ${currentStep} GUARD: Validation passed`);
    }
    */
  }, [currentStep, classifiedId, draft, isLoading, setLocation]);

  // Return validation status for component use
  if (!classifiedId || isLoading) {
    return { isValidating: true, isValid: false };
  }

  if (!draft) {
    return { isValidating: false, isValid: false };
  }

  const validationResult = getValidationForStep(currentStep, draft);

  return {
    isValidating: false,
    isValid: validationResult.isValid,
    validationResult
  };
}

// Hook for getting step completion status
export function useStepCompletion(draft: DraftListing | null) {
  if (!draft) {
    return {
      step1: false,
      step2: false,
      step3: false,
      step4: false
    };
  }

  return {
    step1: draft.step1Completed || false,
    step2: draft.step2Completed || false,
    step3: draft.step3Completed || false,
    step4: draft.step4Completed || false
  };
}

// Hook for checking if user can access a specific step
export function useCanAccessStep(targetStep: number, draft: DraftListing | null) {
  if (!draft) {
    return false;
  }

  const validationResult = getValidationForStep(targetStep, draft);
  
  return validationResult.isValid;
}