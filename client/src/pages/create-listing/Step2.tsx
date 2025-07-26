import { useListing } from '../../contexts/ListingContext';
import { useCategoryCustomFields } from '../../hooks/useCustomFields';
import { useDraftListing, useUpdateDraftListing } from '@/hooks/useDraftListing';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useStep3Prefetch } from '@/hooks/useStep3Prefetch';
import { useStepGuard } from '@/hooks/useStepGuard';
import BreadcrumbNav from '@/components/listing/BreadcrumbNav';
import RichTextEditor from '@/components/RichTextEditor';
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
  
  // NO VALIDATION: Complete freedom to navigate
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Input handler - no validation 
  const handleInputChange = (fieldName: string, value: any) => {
    updateFormData({ [fieldName]: value });
  };

  // RichTextEditor handler - no validation
  const handleDescriptionChange = (value: string) => {
    dispatch({
      type: 'SET_CUSTOM_FIELDS',
      payload: {
        ...formData.customFields,
        description: value
      }
    });
    
    handleInputChange('description', value);
  };

  // Get current classifiedId for API calls
  const currentClassifiedId = classifiedId || new URLSearchParams(window.location.search).get('classifiedId');

  // Draft queries
  const { data: draftData, isLoading: isDraftLoading } = useDraftListing(currentClassifiedId ? parseInt(currentClassifiedId) : null);

  // Update draft mutation
  const { mutateAsync: updateDraftMutation } = useUpdateDraftListing();

  // Mark step completed mutation
  const markStepCompletedMutation = useMutation({
    mutationFn: async ({ classifiedId, step }: { classifiedId: string, step: number }) => {
      const response = await fetch(`/api/draft-listings/${classifiedId}/step/${step}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Step completion failed');
      }
      return response.json();
    }
  });

  // Update form data function
  const updateFormData = (newFields: Record<string, any>) => {
    dispatch({
      type: 'SET_CUSTOM_FIELDS',
      payload: {
        ...formData.customFields,
        ...newFields
      }
    });

    // Update draft in database
    if (currentClassifiedId) {
      const updatedCustomFields = { ...formData.customFields, ...newFields };
      updateDraftMutation({
        id: parseInt(currentClassifiedId),
        data: { customFields: JSON.stringify(updatedCustomFields) }
      });
    }
  };

  // Location data
  const { data: locations = [], isLoading: locationsLoading } = useLocationsTree();
  const { data: locationSettings } = useLocationSettings();

  // Location state
  const [selectedCountry, setSelectedCountry] = useState<Location | null>(null);
  const [selectedCity, setSelectedCity] = useState<Location | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<Location | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Location | null>(null);

  // Create location tree structure
  const locationTree = useMemo(() => {
    const tree: { [key: string]: Location[] } = {
      countries: [],
      cities: {},
      districts: {},
      neighborhoods: {}
    };

    locations.forEach(location => {
      if (location.type === 'country') {
        tree.countries.push(location);
      } else if (location.type === 'city') {
        const key = `country_${location.parentId}`;
        if (!tree.cities[key]) tree.cities[key] = [];
        tree.cities[key].push(location);
      } else if (location.type === 'district') {
        const key = `city_${location.parentId}`;
        if (!tree.districts[key]) tree.districts[key] = [];
        tree.districts[key].push(location);
      } else if (location.type === 'neighborhood') {
        const key = `district_${location.parentId}`;
        if (!tree.neighborhoods[key]) tree.neighborhoods[key] = [];
        tree.neighborhoods[key].push(location);
      }
    });

    return tree;
  }, [locations]);

  // Get available options for each location level
  const availableCountries = locationTree.countries || [];
  const availableCities = selectedCountry ? locationTree.cities[`country_${selectedCountry.id}`] || [] : [];
  const availableDistricts = selectedCity ? locationTree.districts[`city_${selectedCity.id}`] || [] : [];
  const availableNeighborhoods = selectedDistrict ? locationTree.neighborhoods[`district_${selectedDistrict.id}`] || [] : [];

  // Load location data from draft
  useEffect(() => {
    if (draftData?.locationData) {
      try {
        const locationData = JSON.parse(draftData.locationData);
        if (locationData.country) setSelectedCountry(locationData.country);
        if (locationData.city) setSelectedCity(locationData.city);
        if (locationData.district) setSelectedDistrict(locationData.district);
        if (locationData.neighborhood) setSelectedNeighborhood(locationData.neighborhood);
      } catch (error) {
        console.error('Error parsing location data:', error);
      }
    }
  }, [draftData]);

  const nextStep = async () => {
    if (isSubmitting) {
      console.log('🚫 Double-click prevented - already submitting');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('📝 Step2 → Step3: No validation, proceeding with current form data');

      // Update draft with current form data before navigating
      if (currentClassifiedId) {
        const draftData = {
          title: formData.customFields.title || null,
          description: formData.customFields.description || null,
          price: formData.customFields.price ? JSON.stringify(formData.customFields.price) : null,
          customFields: JSON.stringify(formData.customFields),
          locationData: JSON.stringify({
            country: selectedCountry,
            city: selectedCity,
            district: selectedDistrict,
            neighborhood: selectedNeighborhood,
            location: {
              country: selectedCountry,
              city: selectedCity,
              district: selectedDistrict,
              neighborhood: selectedNeighborhood
            }
          })
        };
        
        try {
          await updateDraftMutation.mutateAsync({
            id: currentClassifiedId,
            data: draftData
          });
          
          // NO VALIDATION: Mark Step 2 as completed without any checks
          await markStepCompletedMutation.mutateAsync({ classifiedId: currentClassifiedId, step: 2 });
          
          // Step3 prefetch
          if (user?.id) {
            prefetchStep3Data(currentClassifiedId, user.id);
          }
        } catch (error) {
          console.error('Draft güncellenemedi:', error);
          setIsSubmitting(false);
          return;
        }
      }
      
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
      const url = currentClassifiedId ? 
        `/create-listing/step-3?classifiedId=${currentClassifiedId}` : 
        '/create-listing/step-3';
      navigate(url);
      
    } catch (error) {
      console.error('NextStep error:', error);
      setIsSubmitting(false);
    }
  };

  // Get categoryId from draft or selected category for custom fields
  const categoryIdForFields = draftData?.categoryId || selectedCategory?.id || 0;
  const { data: customFields = [], isLoading: fieldsLoading } = useCategoryCustomFields(categoryIdForFields);

  // Loading check
  if (authLoading || isDraftLoading || fieldsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <IOSSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:pt-6 pt-[64px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:py-3">
          
          {/* Kategori Bilgi Kutusu */}
          <div className="mb-6 lg:mt-0 mt-3">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-md leading-tight">
                    Seçtiğiniz Kategori Bilgileri
                  </h3>
                  <div className="mt-3">
                    {categoryPath && categoryPath.length > 0 && (
                      <BreadcrumbNav 
                        categoryPath={categoryPath}
                        onCategoryClick={() => {}}
                        disableFirstCategory={true}
                      />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate('/create-listing/step-1')}
                  className="text-orange-500 text-sm font-medium hover:text-orange-600 hover:underline transition-colors"
                >
                  Değiştir
                </button>
              </div>
            </div>
          </div>

          {/* İlan Detayları Kutusu */}
          <div className="mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="w-full">
                <h3 className="font-medium text-gray-900 text-md leading-tight mb-6">
                  İlan Detayları
                </h3>

                {/* İlan Başlığı Input */}
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
                        if (value.length <= 64) {
                          handleInputChange('title', value);
                        }
                      }}
                      placeholder="İlanınız için başlık yazınız"
                      maxLength={64}
                      className="py-2.5 sm:py-3 px-4 block w-full rounded-lg sm:text-sm focus:z-10 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Açıklama Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div>
                    <RichTextEditor
                      value={formData.customFields.description || ''}
                      onChange={handleDescriptionChange}
                      placeholder="Ürününüzün detaylı açıklamasını yazınız..."
                      maxLength={2000}
                    />
                  </div>
                </div>

                {/* Fiyat Input */}
                <div className="space-y-2 mb-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Fiyat
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative lg:w-[30%] w-full">
                    <input
                      id="price-input"
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
                      className="py-2.5 sm:py-3 px-4 pe-20 block w-full rounded-lg sm:text-sm focus:z-10 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
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
                  <div className="space-y-6">
                    {customFields.map((field) => {
                      const currentValue = formData.customFields[field.fieldName] || '';
                      
                      return (
                        <div key={field.id} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {field.label}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          
                          {field.fieldType === 'text' && (
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                              placeholder={field.placeholder || ''}
                              className="py-3 px-4 block lg:w-[30%] w-full rounded-lg text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                            />
                          )}

                          {field.fieldType === 'number' && (
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                handleInputChange(field.fieldName, value);
                              }}
                              placeholder={field.placeholder || ''}
                              inputMode="numeric"
                              className="py-3 px-4 block lg:w-[30%] w-full rounded-lg text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                            />
                          )}

                          {field.fieldType === 'select' && field.options && (
                            <select
                              value={currentValue}
                              onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                              className="py-3 px-4 block lg:w-[30%] w-full rounded-lg text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                            >
                              <option value="">Seçiniz</option>
                              {JSON.parse(field.options).map((option: string, index: number) => (
                                <option key={index} value={option}>{option}</option>
                              ))}
                            </select>
                          )}

                          {field.fieldType === 'checkbox' && (
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={currentValue === 'true' || currentValue === true}
                                onChange={(e) => handleInputChange(field.fieldName, e.target.checked)}
                                className="rounded border-gray-300 text-orange-600 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                              />
                              <span className="ml-2 text-sm text-gray-600">{field.placeholder}</span>
                            </div>
                          )}

                          {field.fieldType === 'boolean' && (
                            <select
                              value={currentValue}
                              onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                              className="py-3 px-4 block lg:w-[30%] w-full rounded-lg text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                            >
                              <option value="">Seçiniz</option>
                              <option value="true">Evet</option>
                              <option value="false">Hayır</option>
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Location Selection */}
                {locationSettings && (
                  <div className="mt-8">
                    <h4 className="font-medium text-gray-900 text-md leading-tight mb-4">
                      Konum Bilgileri
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {locationSettings.showCountry && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ülke *
                          </label>
                          <select
                            value={selectedCountry?.id || ''}
                            onChange={(e) => {
                              const country = availableCountries.find(c => c.id === parseInt(e.target.value));
                              setSelectedCountry(country || null);
                              setSelectedCity(null);
                              setSelectedDistrict(null);
                              setSelectedNeighborhood(null);
                            }}
                            className="py-3 px-4 block w-full rounded-lg text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                          >
                            <option value="">Ülke Seçiniz</option>
                            {availableCountries.map((country) => (
                              <option key={country.id} value={country.id}>{country.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {locationSettings.showCity && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            İl *
                          </label>
                          <select
                            value={selectedCity?.id || ''}
                            onChange={(e) => {
                              const city = availableCities.find(c => c.id === parseInt(e.target.value));
                              setSelectedCity(city || null);
                              setSelectedDistrict(null);
                              setSelectedNeighborhood(null);
                            }}
                            disabled={!selectedCountry}
                            className="py-3 px-4 block w-full rounded-lg text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-100"
                          >
                            <option value="">İl Seçiniz</option>
                            {availableCities.map((city) => (
                              <option key={city.id} value={city.id}>{city.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {locationSettings.showDistrict && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            İlçe *
                          </label>
                          <select
                            value={selectedDistrict?.id || ''}
                            onChange={(e) => {
                              const district = availableDistricts.find(d => d.id === parseInt(e.target.value));
                              setSelectedDistrict(district || null);
                              setSelectedNeighborhood(null);
                            }}
                            disabled={!selectedCity}
                            className="py-3 px-4 block w-full rounded-lg text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-100"
                          >
                            <option value="">İlçe Seçiniz</option>
                            {availableDistricts.map((district) => (
                              <option key={district.id} value={district.id}>{district.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {locationSettings.showNeighborhood && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mahalle *
                          </label>
                          <select
                            value={selectedNeighborhood?.id || ''}
                            onChange={(e) => {
                              const neighborhood = availableNeighborhoods.find(n => n.id === parseInt(e.target.value));
                              setSelectedNeighborhood(neighborhood || null);
                            }}
                            disabled={!selectedDistrict}
                            className="py-3 px-4 block w-full rounded-lg text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-100"
                          >
                            <option value="">Mahalle Seçiniz</option>
                            {availableNeighborhoods.map((neighborhood) => (
                              <option key={neighborhood.id} value={neighborhood.id}>{neighborhood.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
            <button
              onClick={() => navigate('/create-listing/step-1')}
              className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Önceki Adım
            </button>
            
            <button
              onClick={nextStep}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <IOSSpinner />
                  İşleniyor...
                </>
              ) : (
                'Sonraki Adım'
              )}
            </button>
          </div>
        </div>
      </div>
      <PageLoadIndicator />
    </div>
  );
}