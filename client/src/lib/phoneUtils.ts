import { parsePhoneNumber, formatIncompletePhoneNumber, getCountries, getCountryCallingCode } from 'libphonenumber-js';

export interface CountryOption {
  code: string;
  country: string;
  name: string;
}

// Popular countries for phone input
export const POPULAR_COUNTRIES: CountryOption[] = [
  { code: '+90', country: 'TR', name: 'Türkiye' },
  { code: '+1', country: 'US', name: 'Amerika' },
  { code: '+44', country: 'GB', name: 'İngiltere' },
  { code: '+49', country: 'DE', name: 'Almanya' },
  { code: '+33', country: 'FR', name: 'Fransa' },
  { code: '+39', country: 'IT', name: 'İtalya' },
  { code: '+34', country: 'ES', name: 'İspanya' },
  { code: '+31', country: 'NL', name: 'Hollanda' },
];

// Format phone number as user types (WhatsApp style)
export const formatPhoneAsYouType = (value: string, countryCode: string = 'TR'): string => {
  // Remove all non-digits
  const cleaned = value.replace(/\D/g, '');
  
  if (!cleaned) return '';
  
  try {
    // Use libphonenumber's formatIncompletePhoneNumber for real-time formatting
    const formatted = formatIncompletePhoneNumber(cleaned, countryCode as any);
    return formatted || cleaned;
  } catch (error) {
    return cleaned;
  }
};

// Validate phone number
export const validatePhoneNumber = (value: string, countryCode: string = 'TR'): boolean => {
  if (!value) return false;
  
  try {
    const phoneNumber = parsePhoneNumber(value, countryCode as any);
    return phoneNumber ? phoneNumber.isValid() : false;
  } catch (error) {
    return false;
  }
};

// Get country code from country string
export const getCountryCode = (country: string): string => {
  try {
    return `+${getCountryCallingCode(country as any)}`;
  } catch (error) {
    return '+90'; // Default to Turkey
  }
};

// Clean phone number input (only allow digits)
export const cleanPhoneInput = (value: string): string => {
  return value.replace(/\D/g, '');
};