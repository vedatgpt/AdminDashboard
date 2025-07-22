// Centralized Error Handling Utilities

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

/**
 * Parse server error response from API calls
 * Handles both JSON and plain text error responses
 */
export function parseServerError(error: any): ApiError {
  try {
    // Check if error has the expected format from apiRequest
    if (error.message && error.message.includes(":")) {
      const errorText = error.message.split(": ")[1];
      
      try {
        const errorData = JSON.parse(errorText);
        return {
          message: errorData.error || errorData.message || "İşlem başarısız",
          status: parseInt(error.message.split(": ")[0]) || 500,
          details: errorData.details
        };
      } catch {
        return {
          message: errorText || "İşlem başarısız",
          status: parseInt(error.message.split(": ")[0]) || 500
        };
      }
    }
    
    // Fallback for other error formats
    return {
      message: error.message || error.toString() || "Beklenmeyen bir hata oluştu",
      status: error.status || 500
    };
  } catch {
    return {
      message: "Beklenmeyen bir hata oluştu",
      status: 500
    };
  }
}

/**
 * Get user-friendly error message for display
 */
export function getErrorMessage(error: any): string {
  const parsedError = parseServerError(error);
  return parsedError.message;
}

/**
 * Check if error indicates unauthorized access
 */
export function isUnauthorizedError(error: any): boolean {
  const parsedError = parseServerError(error);
  return parsedError.status === 401;
}

/**
 * Check if error indicates forbidden access
 */
export function isForbiddenError(error: any): boolean {
  const parsedError = parseServerError(error);
  return parsedError.status === 403;
}

/**
 * Default error handler for mutations
 */
export function createMutationErrorHandler(
  defaultMessage: string = "İşlem başarısız"
) {
  return (error: any) => {
    const errorMessage = getErrorMessage(error) || defaultMessage;
    
    // You can add toast notification here if needed
    // This is a centralized place to handle all mutation errors
    console.error("Mutation error:", error);
    
    return errorMessage;
  };
}