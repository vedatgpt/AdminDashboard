import React from 'react';
import RichTextEditor from '../RichTextEditor';
import { LISTING_CONFIG } from '@shared/constants';

interface ListingDetailsProps {
  formData: {
    customFields: Record<string, any>;
  };
  validationErrors: Record<string, string>;
  showValidation: boolean;
  onInputChange: (fieldName: string, value: any) => void;
  onDescriptionChange: (value: string) => void;
}

export default function ListingDetails({
  formData,
  validationErrors,
  showValidation,
  onInputChange,
  onDescriptionChange
}: ListingDetailsProps) {
  return (
    <div className="mb-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="w-full">
          <h3 className="font-medium text-gray-900 text-md leading-tight mb-6">
            İlan Detayları
          </h3>

          {/* İlan Başlığı Input - Tüm kategoriler için geçerli */}
          <div className="space-y-2 mb-6">
            <label className="block text-sm font-medium text-gray-700">
              İlan Başlığı
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                id="title-input"
                type="text"
                value={formData.customFields.title || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= LISTING_CONFIG.MAX_TITLE_LENGTH) {
                    onInputChange('title', value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const priceInput = document.getElementById('price-input');
                    if (priceInput) {
                      priceInput.focus();
                    }
                  }
                }}
                placeholder="İlanınız için başlık yazınız"
                maxLength={LISTING_CONFIG.MAX_TITLE_LENGTH}
                className={`py-2.5 sm:py-3 px-4 block w-full rounded-lg sm:text-sm focus:z-10 ${
                  showValidation && validationErrors.title 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500'
                }`}
              />
              {showValidation && validationErrors.title && (
                <div className="absolute inset-y-0 end-0 flex items-center pointer-events-none pe-3">
                  <svg className="shrink-0 size-4 text-red-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" x2="12" y1="8" y2="12"></line>
                    <line x1="12" x2="12.01" y1="16" y2="16"></line>
                  </svg>
                </div>
              )}
            </div>
            {showValidation && validationErrors.title && (
              <p className="mt-2 text-sm text-red-600">{validationErrors.title}</p>
            )}
          </div>

          {/* Açıklama Input - Rich Text Editor */}
          <div className="space-y-2 mb-6">
            <label className="block text-sm font-medium text-gray-700">
              İlan Açıklaması
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className={showValidation && validationErrors.description ? 'border border-red-500 rounded-lg' : ''}>
              <RichTextEditor
                value={formData.customFields.description || ''}
                onChange={onDescriptionChange}
                placeholder="İlanınız hakkında detaylı bilgi veriniz..."
              />
            </div>
            {showValidation && validationErrors.description && (
              <p className="mt-2 text-sm text-red-600">{validationErrors.description}</p>
            )}
          </div>

          {/* Fiyat Input - Tüm kategoriler için geçerli */}
          <div className="space-y-2 mb-6">
            <label className="block text-sm font-medium text-gray-700">
              Fiyat
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                id="price-input"
                type="text"
                value={formData.customFields.price || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Sadece sayı ve nokta karakterlerine izin ver
                  if (/^[\d.]*$/.test(value)) {
                    onInputChange('price', value);
                  }
                }}
                placeholder="Fiyat giriniz (örn: 50000)"
                className={`py-2.5 sm:py-3 px-4 block w-full rounded-lg sm:text-sm focus:z-10 ${
                  showValidation && validationErrors.price 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500'
                }`}
              />
              {showValidation && validationErrors.price && (
                <div className="absolute inset-y-0 end-0 flex items-center pointer-events-none pe-3">
                  <svg className="shrink-0 size-4 text-red-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" x2="12" y1="8" y2="12"></line>
                    <line x1="12" x2="12.01" y1="16" y2="16"></line>
                  </svg>
                </div>
              )}
            </div>
            {showValidation && validationErrors.price && (
              <p className="mt-2 text-sm text-red-600">{validationErrors.price}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 