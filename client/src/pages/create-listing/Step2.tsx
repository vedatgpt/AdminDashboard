import { useListing } from '../../contexts/ListingContext';
import { useCategoryCustomFields } from '../../hooks/useCustomFields';
import { useDraftListing, useUpdateDraftListing } from '@/hooks/useDraftListing';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useStep3Prefetch } from '@/hooks/useStep3Prefetch';
import BreadcrumbNav from '@/components/listing/BreadcrumbNav';
import { PageLoadIndicator } from '@/components/PageLoadIndicator';
import { IOSSpinner } from '../../components/iOSSpinner';
import { useLocationsTree } from '@/hooks/useLocations';
import { useLocationSettings } from '@/hooks/useLocationSettings';
import { useCategoriesTree } from '@/hooks/useCategories';
import { useState, useMemo, useEffect } from 'react';
import type { Location, Category } from '@shared/schema';

export default function Step2() {
  const { state, dispatch } = useListing();
  const { selectedCategory, formData, categoryPath, classifiedId } = state;
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { prefetchStep3Data } = useStep3Prefetch();

  // Input handler 
  const handleInputChange = (fieldName: string, value: any) => {
    updateFormData({ [fieldName]: value });
  };

  // Description change handler with proper sync
  const handleDescriptionChange = (text: string) => {
    // Önce local state'i güncelle
    dispatch({
      type: 'UPDATE_FORM_DATA',
      payload: {
        customFields: {
          ...formData.customFields,
          description: text
        }
      }
    });
    
    // Sonra database'e kaydet
    handleInputChange('description', text);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login');
      return;
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Ürün özel alan verilerini çek
  const { data: customFields, isLoading: customFieldsLoading } = useCategoryCustomFields(
    selectedCategory?.id || 0,
    !!selectedCategory?.id
  );

  // Location state
  const [selectedCountry, setSelectedCountry] = useState<Location | null>(null);
  const [selectedCity, setSelectedCity] = useState<Location | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<Location | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Location | null>(null);

  // Location hooks
  const { data: locationsTree, isLoading: locationsLoading } = useLocationsTree();
  const { data: locationSettings } = useLocationSettings();

  // Draft listing operations
  const { data: existingDraft, isLoading: draftLoading } = useDraftListing(classifiedId);
  const updateDraft = useUpdateDraftListing();

  // Location data processing
  const availableCountries = useMemo(() => {
    if (!locationsTree) return [];
    return locationsTree.filter(loc => loc.level === 1);
  }, [locationsTree]);

  const availableCities = useMemo(() => {
    if (!locationsTree || !selectedCountry) return [];
    return locationsTree.filter(loc => 
      loc.level === 2 && loc.parentId === selectedCountry.id
    );
  }, [locationsTree, selectedCountry]);

  const availableDistricts = useMemo(() => {
    if (!locationsTree || !selectedCity) return [];
    return locationsTree.filter(loc => 
      loc.level === 3 && loc.parentId === selectedCity.id
    );
  }, [locationsTree, selectedCity]);

  const availableNeighborhoods = useMemo(() => {
    if (!locationsTree || !selectedDistrict) return [];
    return locationsTree.filter(loc => 
      loc.level === 4 && loc.parentId === selectedDistrict.id
    );
  }, [locationsTree, selectedDistrict]);

  // Initialize location data from draft
  useEffect(() => {
    if (existingDraft?.locationData) {
      const locationData = existingDraft.locationData;
      if (locationData.country) setSelectedCountry(locationData.country);
      if (locationData.city) setSelectedCity(locationData.city);
      if (locationData.district) setSelectedDistrict(locationData.district);
      if (locationData.neighborhood) setSelectedNeighborhood(locationData.neighborhood);
    }
  }, [existingDraft]);

  const updateFormData = (updates: any) => {
    dispatch({
      type: 'UPDATE_FORM_DATA',
      payload: updates
    });

    // Auto-save to draft database
    if (classifiedId) {
      const newFormData = { ...formData, ...updates };
      updateDraft.mutate({
        id: classifiedId,
        title: newFormData.customFields?.title || '',
        description: newFormData.customFields?.description || '',
        price: newFormData.customFields?.price || null,
        customFields: newFormData.customFields || {},
        locationData: {
          country: selectedCountry,
          city: selectedCity,
          district: selectedDistrict,
          neighborhood: selectedNeighborhood
        }
      });
    }
  };

  // Navigation handlers
  const handleBackClick = () => {
    navigate('/create-listing/step-1');
  };

  const handleNextStep = () => {
    prefetchStep3Data(classifiedId);
    navigate(`/create-listing/step-3?classifiedId=${classifiedId}`);
  };

  // Loading state
  if (authLoading || draftLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <IOSSpinner size="large" />
      </div>
    );
  }

  if (!selectedCategory) {
    navigate('/create-listing/step-1');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageLoadIndicator />
      
      {/* Desktop ve Mobile Layout */}
      <div className="pt-[60px] lg:pt-0">
        <div className="max-w-4xl mx-auto p-6">
          
          {/* Category info box */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 text-sm mb-3">
                  Seçtiğiniz Araca Ait Bilgiler
                </h3>
                <BreadcrumbNav 
                  categories={categoryPath}
                  disableFirstCategory={true}
                />
              </div>
              <button
                onClick={handleBackClick}
                className="text-orange-500 hover:text-orange-600 text-sm font-medium hover:underline"
              >
                Değiştir
              </button>
            </div>
          </div>

          {/* Desktop title */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold text-gray-900">İlan Detayları</h1>
          </div>

          {/* Form container */}
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
                <input
                  type="text"
                  value={formData.customFields.title || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 64) {
                      handleInputChange('title', value);
                    }
                  }}
                  placeholder="İlanınız için başlık yazınız"
                  maxLength={64}
                  className="py-2.5 sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                />
                <div className="text-xs text-gray-500 text-right">
                  {(formData.customFields.title || '').length} / 64 karakter
                </div>
              </div>

              {/* Açıklama Input - Tüm kategoriler için geçerli */}
              <div className="space-y-2 mb-6">
                <label className="block text-sm font-medium text-gray-700">
                  Açıklama
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={formData.customFields.description || ''}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Ürününüzün detaylı açıklamasını yazınız..."
                  rows={8}
                  maxLength={2000}
                  className="py-2.5 sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                />
                <div className="text-xs text-gray-500 text-right">
                  {(formData.customFields.description || '').length} / 2000 karakter
                </div>
              </div>

              {/* Fiyat Input - Tüm kategoriler için geçerli */}
              <div className="space-y-2 mb-6">
                <label className="block text-sm font-medium text-gray-700">
                  Fiyat
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative lg:w-[30%] w-full">
                  <input
                    type="text"
                    value={(() => {
                      const priceValue = formData.customFields.price || '';
                      const value = typeof priceValue === 'object' ? priceValue.value || '' : priceValue || '';
                      return value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
                    })()}
                    onChange={(e) => {
                      let processedValue = e.target.value.replace(/\D/g, '');
                      const currentPrice = formData.customFields.price || {};
                      const selectedCurrency = typeof currentPrice === 'object' ? currentPrice.unit || 'TL' : 'TL';
                      handleInputChange('price', { value: processedValue, unit: selectedCurrency });
                    }}
                    placeholder="Fiyat giriniz"
                    inputMode="numeric"
                    className="py-2.5 sm:py-3 px-4 pe-20 block w-full border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
                    <select
                      value={(() => {
                        const currentPrice = formData.customFields.price || {};
                        return typeof currentPrice === 'object' ? currentPrice.unit || 'TL' : 'TL';
                      })()}
                      onChange={(e) => {
                        const currentPrice = formData.customFields.price || {};
                        const value = typeof currentPrice === 'object' ? currentPrice.value || '' : currentPrice || '';
                        handleInputChange('price', { value, unit: e.target.value });
                      }}
                      className="block w-full border-transparent rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="TL">TL</option>
                      <option value="GBP">GBP</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Custom Fields */}
              {customFields && customFields.length > 0 && (
                <div className="space-y-6 mb-6">
                  <h4 className="font-medium text-gray-900 text-sm">
                    Ürün Özellikleri
                  </h4>
                  
                  {customFields.map((field) => {
                    const currentValue = formData.customFields[field.fieldName];
                    
                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {field.label}
                          {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </label>

                        {/* Text Field */}
                        {field.fieldType === 'text' && (
                          <div className="relative lg:w-[30%] w-full">
                            <input
                              type="text"
                              value={typeof currentValue === 'object' ? currentValue.value || '' : currentValue || ''}
                              onChange={(e) => {
                                if (field.hasUnits && field.unitOptions) {
                                  const unitOptions = JSON.parse(field.unitOptions || '[]');
                                  const selectedUnit = typeof currentValue === 'object' 
                                    ? currentValue.unit || field.defaultUnit || unitOptions[0]
                                    : field.defaultUnit || unitOptions[0];
                                  handleInputChange(field.fieldName, { value: e.target.value, unit: selectedUnit });
                                } else {
                                  handleInputChange(field.fieldName, e.target.value);
                                }
                              }}
                              placeholder={field.placeholder || ''}
                              className="py-2.5 sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-orange-500 focus:ring-orange-500"
                            />
                          </div>
                        )}

                        {/* Number Field */}
                        {field.fieldType === 'number' && (
                          <div className="relative lg:w-[30%] w-full">
                            <input
                              type="number"
                              value={typeof currentValue === 'object' ? currentValue.value || '' : currentValue || ''}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                if (field.minValue !== null && value < field.minValue) return;
                                if (field.maxValue !== null && value > field.maxValue) return;
                                
                                if (field.hasUnits && field.unitOptions) {
                                  const unitOptions = JSON.parse(field.unitOptions || '[]');
                                  const selectedUnit = typeof currentValue === 'object' 
                                    ? currentValue.unit || field.defaultUnit || unitOptions[0]
                                    : field.defaultUnit || unitOptions[0];
                                  handleInputChange(field.fieldName, { value: e.target.value, unit: selectedUnit });
                                } else {
                                  handleInputChange(field.fieldName, e.target.value);
                                }
                              }}
                              placeholder={field.placeholder || ''}
                              className="py-2.5 sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-orange-500 focus:ring-orange-500"
                            />
                          </div>
                        )}

                        {/* Select Field */}
                        {field.fieldType === 'select' && field.options && (
                          <div className="lg:w-[30%] w-full">
                            <select
                              value={currentValue || ''}
                              onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                              className="py-2.5 sm:py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-orange-500 focus:ring-orange-500"
                            >
                              <option value="">Seçiniz</option>
                              {JSON.parse(field.options).map((option: string) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Checkbox Field */}
                        {field.fieldType === 'checkbox' && field.options && (
                          <div className="space-y-2">
                            {JSON.parse(field.options).map((option: string) => (
                              <label key={option} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={(currentValue || []).includes(option)}
                                  onChange={(e) => {
                                    const currentValues = currentValue || [];
                                    if (e.target.checked) {
                                      handleInputChange(field.fieldName, [...currentValues, option]);
                                    } else {
                                      handleInputChange(field.fieldName, currentValues.filter((v: string) => v !== option));
                                    }
                                  }}
                                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">{option}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* Boolean Field */}
                        {field.fieldType === 'boolean' && (
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={currentValue === true}
                              onChange={(e) => handleInputChange(field.fieldName, e.target.checked)}
                              className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{field.label}</span>
                          </label>
                        )}

                        {/* Min/Max validation display */}
                        {field.fieldType === 'number' && field.minValue !== null && field.maxValue !== null && (
                          <p className="text-sm text-gray-500">
                            {field.minValue} - {field.maxValue} arasında
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Lokasyon Bilgileri Kutusu */}
          <div className="mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="w-full">
                <h3 className="font-medium text-gray-900 text-md leading-tight mb-6">
                  Adres Bilgileri
                </h3>

                {/* Desktop'ta yan yana, mobile'da alt alta */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">

                  {/* Ülke Seçimi - Sadece aktifse göster */}
                  {locationSettings?.showCountry && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Ülke
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={selectedCountry?.id || ''}
                        onChange={(e) => {
                          const countryId = parseInt(e.target.value);
                          const country = availableCountries.find(c => c.id === countryId);
                          setSelectedCountry(country || null);
                          setSelectedCity(null);
                          setSelectedDistrict(null);
                          setSelectedNeighborhood(null);
                          updateFormData({
                            location: {
                              country: country || null,
                              city: null,
                              district: null,
                              neighborhood: null
                            }
                          });
                        }}
                        className="py-2.5 sm:py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-orange-500 focus:ring-orange-500"
                      >
                        <option value="">Ülke seçiniz</option>
                        {availableCountries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Şehir Seçimi - Sadece aktifse göster */}
                  {locationSettings?.showCity && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Şehir
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={selectedCity?.id || ''}
                        onChange={(e) => {
                          const cityId = parseInt(e.target.value);
                          const city = availableCities.find(c => c.id === cityId);
                          setSelectedCity(city || null);
                          setSelectedDistrict(null);
                          setSelectedNeighborhood(null);
                          updateFormData({
                            location: {
                              ...formData.location,
                              city: city || null,
                              district: null,
                              neighborhood: null
                            }
                          });
                        }}
                        disabled={!selectedCountry && locationSettings?.showCountry}
                        className="py-2.5 sm:py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-100"
                      >
                        <option value="">Şehir seçiniz</option>
                        {availableCities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* İlçe Seçimi - Sadece aktifse göster */}
                  {locationSettings?.showDistrict && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        İlçe
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={selectedDistrict?.id || ''}
                        onChange={(e) => {
                          const districtId = parseInt(e.target.value);
                          const district = availableDistricts.find(d => d.id === districtId);
                          setSelectedDistrict(district || null);
                          setSelectedNeighborhood(null);
                          updateFormData({
                            location: {
                              ...formData.location,
                              district: district || null,
                              neighborhood: null
                            }
                          });
                        }}
                        disabled={!selectedCity}
                        className="py-2.5 sm:py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-100"
                      >
                        <option value="">İlçe seçiniz</option>
                        {availableDistricts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Mahalle Seçimi - Sadece aktifse göster */}
                  {locationSettings?.showNeighborhood && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Mahalle
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={selectedNeighborhood?.id || ''}
                        onChange={(e) => {
                          const neighborhoodId = parseInt(e.target.value);
                          const neighborhood = availableNeighborhoods.find(n => n.id === neighborhoodId);
                          setSelectedNeighborhood(neighborhood || null);
                          updateFormData({
                            location: {
                              ...formData.location,
                              neighborhood: neighborhood || null
                            }
                          });
                        }}
                        disabled={!selectedDistrict}
                        className="py-2.5 sm:py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-100"
                      >
                        <option value="">Mahalle seçiniz</option>
                        {availableNeighborhoods.map((neighborhood) => (
                          <option key={neighborhood.id} value={neighborhood.id}>
                            {neighborhood.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleBackClick}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              ← Önceki Adım
            </button>
            
            <button
              onClick={handleNextStep}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Sonraki Adım →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}