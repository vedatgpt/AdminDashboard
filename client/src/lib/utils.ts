/**
 * Utility Functions
 * 
 * Common utility functions used across the application.
 * Includes class name merging for Tailwind CSS and other utilities.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges CSS class names using clsx and tailwind-merge
 * Handles conditional classes and removes Tailwind CSS conflicts
 * 
 * @param inputs - Class names to combine
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
