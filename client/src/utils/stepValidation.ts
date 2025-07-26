import { DraftListing } from "@shared/schema";

// Step validation utility functions for Progressive Disclosure
export interface StepValidationResult {
  isValid: boolean;
  missingFields: string[];
  redirectStep?: number;
}

// Validate Step 1 completion (category selection)
export function validateStep1(draft: DraftListing | null): StepValidationResult {
  if (!draft) {
    return {
      isValid: false,
      missingFields: ["Draft listing not found"],
      redirectStep: 1
    };
  }

  if (!draft.categoryId || !draft.step1Completed) {
    return {
      isValid: false,
      missingFields: ["Category selection required"],
      redirectStep: 1
    };
  }

  return { isValid: true, missingFields: [] };
}

// Validate Step 2 completion (form data)
export function validateStep2(draft: DraftListing | null): StepValidationResult {
  const step1Result = validateStep1(draft);
  if (!step1Result.isValid) {
    return step1Result;
  }

  if (!draft) {
    return {
      isValid: false,
      missingFields: ["Draft listing not found"],
      redirectStep: 1
    };
  }

  const missingFields: string[] = [];

  // Check required Step 2 fields
  if (!draft.title || draft.title.trim() === "") {
    missingFields.push("Title required");
  }

  if (!draft.description || draft.description.trim() === "") {
    missingFields.push("Description required");
  }

  if (!draft.price || draft.price.trim() === "") {
    missingFields.push("Price required");
  }

  // Check custom fields completion
  try {
    const customFields = draft.customFields ? JSON.parse(draft.customFields) : {};
    
    // Basic validation - at least some custom fields should be filled
    if (!customFields || Object.keys(customFields).length === 0) {
      missingFields.push("Form data required");
    }
  } catch (error) {
    missingFields.push("Invalid form data");
  }

  if (missingFields.length > 0 || !draft.step2Completed) {
    return {
      isValid: false,
      missingFields,
      redirectStep: 2
    };
  }

  return { isValid: true, missingFields: [] };
}

// Validate Step 3 completion (photos)
export function validateStep3(draft: DraftListing | null): StepValidationResult {
  const step2Result = validateStep2(draft);
  if (!step2Result.isValid) {
    return step2Result;
  }

  if (!draft) {
    return {
      isValid: false,
      missingFields: ["Draft listing not found"],
      redirectStep: 1
    };
  }

  const missingFields: string[] = [];

  // Check photos completion
  try {
    const photos = draft.photos ? JSON.parse(draft.photos) : [];
    
    if (!Array.isArray(photos) || photos.length === 0) {
      missingFields.push("At least one photo required");
    }
  } catch (error) {
    missingFields.push("Invalid photo data");
  }

  if (missingFields.length > 0 || !draft.step3Completed) {
    return {
      isValid: false,
      missingFields,
      redirectStep: 3
    };
  }

  return { isValid: true, missingFields: [] };
}

// Validate Step 4 access (preview)
export function validateStep4(draft: DraftListing | null): StepValidationResult {
  const step3Result = validateStep3(draft);
  if (!step3Result.isValid) {
    return step3Result;
  }

  // Step 4 is the final preview step, no additional validation needed
  return { isValid: true, missingFields: [] };
}

// Get validation function by step number
export function getStepValidator(step: number): (draft: DraftListing | null) => StepValidationResult {
  switch (step) {
    case 1:
      return validateStep1;
    case 2:
      return validateStep2;
    case 3:
      return validateStep3;
    case 4:
      return validateStep4;
    default:
      return validateStep1;
  }
}

// Helper function to determine which step user should be redirected to
export function getRedirectPath(classifiedId: string, targetStep: number): string {
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