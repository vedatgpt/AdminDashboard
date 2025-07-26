import { DraftListing } from '@shared/schema';

export interface StepValidationResult {
  isValid: boolean;
  redirectTo?: number;
  message?: string;
}

export const validateStepAccess = (
  targetStep: number,
  draftData: DraftListing | null
): StepValidationResult => {
  // Step 1: Herkes erişebilir
  if (targetStep === 1) {
    return { isValid: true };
  }

  // Draft yoksa Step 1'e yönlendir
  if (!draftData) {
    return {
      isValid: false,
      redirectTo: 1,
      message: "İlan oluşturmak için kategori seçiniz"
    };
  }

  // Step 2: Kategori seçimi gerekli
  if (targetStep === 2) {
    if (!draftData.categoryId) {
      return {
        isValid: false,
        redirectTo: 1,
        message: "Önce kategori seçimi yapınız"
      };
    }
    return { isValid: true };
  }

  // Step 3: Temel bilgiler gerekli
  if (targetStep === 3) {
    if (!draftData.categoryId) {
      return {
        isValid: false,
        redirectTo: 1,
        message: "Önce kategori seçimi yapınız"
      };
    }

    if (!hasRequiredFields(draftData)) {
      return {
        isValid: false,
        redirectTo: 2,
        message: "Önce gerekli bilgileri tamamlayınız"
      };
    }
    return { isValid: true };
  }

  // Step 4: Temel bilgiler + fotoğraf gerekli
  if (targetStep === 4) {
    if (!draftData.categoryId) {
      return {
        isValid: false,
        redirectTo: 1,
        message: "Önce kategori seçimi yapınız"
      };
    }

    if (!hasRequiredFields(draftData)) {
      return {
        isValid: false,
        redirectTo: 2,
        message: "Önce gerekli bilgileri tamamlayınız"
      };
    }

    if (!hasPhotos(draftData)) {
      return {
        isValid: false,
        redirectTo: 3,
        message: "Önce fotoğraf yükleyiniz"
      };
    }
    return { isValid: true };
  }

  return { isValid: false, redirectTo: 1 };
};

// Temel bilgilerin tamamlanıp tamamlanmadığını kontrol et
const hasRequiredFields = (draftData: DraftListing): boolean => {
  try {
    const customFields = draftData.customFields ? JSON.parse(draftData.customFields) : {};
    
    // Title ve description zorunlu
    if (!customFields.title || customFields.title.trim() === '') {
      return false;
    }
    
    if (!customFields.description || customFields.description.trim() === '') {
      return false;
    }

    // Price zorunlu
    if (!customFields.price || !customFields.price.value || customFields.price.value.trim() === '') {
      return false;
    }

    // Location bilgileri zorunlu
    const locationData = draftData.locationData ? JSON.parse(draftData.locationData) : {};
    if (!locationData.district || !locationData.district.id) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Fotoğraf yüklenip yüklenmediğini kontrol et
const hasPhotos = (draftData: DraftListing): boolean => {
  try {
    const photos = draftData.photos ? JSON.parse(draftData.photos) : [];
    return Array.isArray(photos) && photos.length > 0;
  } catch (error) {
    return false;
  }
};

// Step numarasını URL'den çıkar
export const getStepFromPath = (pathname: string): number => {
  const match = pathname.match(/\/create-listing\/step-(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
};