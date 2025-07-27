// Listing configuration constants
export const LISTING_CONFIG = {
  MAX_IMAGES: 10,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 1000,
} as const;

// Error messages for user feedback
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Bu işlemi gerçekleştirmek için yetkiniz bulunmamaktadır',
  FORBIDDEN: 'Bu içeriğe erişim yetkiniz yok',
  NETWORK_ERROR: 'Ağ hatası oluştu, lütfen tekrar deneyin',
  FILE_TOO_LARGE: 'Dosya boyutu çok büyük',
  TOO_MANY_FILES: 'Çok fazla dosya seçildi',
  INVALID_FILE_TYPE: 'Geçersiz dosya formatı',
  HEIC_NOT_SUPPORTED: 'HEIC dosya formatı desteklenmemektedir. Lütfen JPG, PNG veya WebP formatında fotoğraf yükleyiniz.',
  UNSUPPORTED_IMAGE_FORMAT: 'Bu dosya formatı desteklenmemektedir. Lütfen JPG, PNG veya WebP formatında fotoğraf yükleyiniz.',
  UPLOAD_FAILED: 'Yükleme başarısız',
  SAVE_FAILED: 'Kaydetme başarısız',
  DELETE_FAILED: 'Silme işlemi başarısız',
  FORM_VALIDATION_ERROR: 'Form doğrulama hatası',
  MISSING_REQUIRED_FIELDS: 'Zorunlu alanlar eksik',
} as const;

// Step validation messages
export const STEP_VALIDATION = {
  STEP_1_INCOMPLETE: 'Kategori ve konum bilgilerini tamamlayınız',
  STEP_2_INCOMPLETE: 'İlan detaylarını tamamlayınız',
  STEP_3_INCOMPLETE: 'En az bir fotoğraf yüklemeniz gerekmektedir',
  STEP_4_INCOMPLETE: 'İletişim bilgilerini tamamlayınız',
} as const;

// Draft status constants
export const DRAFT_STATUS = {
  CREATING: 'creating',
  EDITING: 'editing',
  COMPLETE: 'complete',
  PUBLISHED: 'published',
} as const;

export type DraftStatus = typeof DRAFT_STATUS[keyof typeof DRAFT_STATUS];