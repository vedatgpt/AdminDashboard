// Phone utility functions and constants

export interface CountryCode {
  code: string;
  country: string;
  flag: string;
  format: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: '+90', country: 'TR', flag: '🇹🇷', format: 'XXX XXX XX XX' },
  { code: '+1', country: 'US', flag: '🇺🇸', format: 'XXX XXX XXXX' },
  { code: '+44', country: 'GB', flag: '🇬🇧', format: 'XXXX XXX XXX' },
  { code: '+49', country: 'DE', flag: '🇩🇪', format: 'XXX XXX XXXX' },
  { code: '+33', country: 'FR', flag: '🇫🇷', format: 'X XX XX XX XX' },
  { code: '+39', country: 'IT', flag: '🇮🇹', format: 'XXX XXX XXXX' },
  { code: '+34', country: 'ES', flag: '🇪🇸', format: 'XXX XXX XXX' },
  { code: '+31', country: 'NL', flag: '🇳🇱', format: 'X XXXX XXXX' },
  { code: '+86', country: 'CN', flag: '🇨🇳', format: 'XXX XXXX XXXX' },
  { code: '+81', country: 'JP', flag: '🇯🇵', format: 'XX XXXX XXXX' },
];

// Remove all non-numeric characters
export const cleanPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Format phone number based on country code
export const formatPhoneNumber = (value: string, countryCode: string = '+90'): string => {
  const cleaned = cleanPhoneNumber(value);
  const country = COUNTRY_CODES.find(c => c.code === countryCode);
  
  if (!country || !cleaned) return cleaned;

  // Apply formatting based on country pattern
  let formatted = '';
  let cleanIndex = 0;
  
  for (let i = 0; i < country.format.length && cleanIndex < cleaned.length; i++) {
    if (country.format[i] === 'X') {
      formatted += cleaned[cleanIndex];
      cleanIndex++;
    } else {
      formatted += country.format[i];
    }
  }
  
  // Add remaining digits if any
  if (cleanIndex < cleaned.length) {
    formatted += cleaned.substring(cleanIndex);
  }
  
  return formatted;
};

// Validate phone number length based on country
export const isValidPhoneLength = (value: string, countryCode: string = '+90'): boolean => {
  const cleaned = cleanPhoneNumber(value);
  const country = COUNTRY_CODES.find(c => c.code === countryCode);
  
  if (!country) return cleaned.length >= 10; // Default minimum length
  
  // Count X's in format to get expected length
  const expectedLength = country.format.split('X').length - 1;
  
  // Allow some flexibility (+/- 2 digits)
  return cleaned.length >= expectedLength - 2 && cleaned.length <= expectedLength + 2;
};

// Get placeholder based on country format
export const getPhonePlaceholder = (countryCode: string = '+90'): string => {
  const country = COUNTRY_CODES.find(c => c.code === countryCode);
  return country ? country.format.replace(/X/g, '5') : '555 123 4567';
};