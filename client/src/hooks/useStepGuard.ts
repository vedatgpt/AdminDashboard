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
export function useStepGuard(
  currentStep: number,
  classifiedId: string | null,
  draft: DraftListing | null,
  isLoading: boolean = false
) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Skip validation if still loading or no classifiedId
    if (isLoading || !classifiedId) {
      return;
    }

    // Skip validation if no draft found (will be handled by individual components)
    if (!draft) {
      return;
    }

    // Get appropriate validator for current step
    const validationResult = getValidationForStep(currentStep, draft);

    if (!validationResult.isValid && validationResult.redirectStep) {
      // Redirect to appropriate step with error feedback
      const redirectPath = getRedirectPath(classifiedId, validationResult.redirectStep);
      
      // Show user-friendly error message
      console.warn(`Step ${currentStep} validation failed:`, validationResult.missingFields);
      
      // Redirect to the required step
      setTimeout(() => {
        setLocation(redirectPath);
      }, 100); // Small delay to prevent render conflicts
    }
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