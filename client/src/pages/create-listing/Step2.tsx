import { useListing } from '../../contexts/ListingContext';
import { useCategoryCustomFields } from '../../hooks/useCustomFields';
import { useDraftListing, useUpdateDraftListing } from '@/hooks/useDraftListing';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useStep3Prefetch } from '@/hooks/useStep3Prefetch';
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

  // Input handler 
  const handleInputChange = (fieldName: string, value: any) => {
    updateFormData({ [fieldName]: value });
  };

  // RichTextEditor için handler
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [authLoading, isAuthenticated]);
  
  // URL parameter support
  const urlParams = new URLSearchParams(window.location.search);
  const classifiedIdParam = urlParams.get('classifiedId');
  const currentClassifiedId = state.classifiedId || classifiedId || (classifiedIdParam ? parseInt(classifiedIdParam) : undefined);
  
  // Draft listing hooks
  const { data: draftData, error: draftError, isError: isDraftError, isLoading: isDraftLoading } = useDraftListing(currentClassifiedId);
  const updateDraftMutation = useUpdateDraftListing();

  // Security fix - URL manipulation protection
  useEffect(() => {
    if (isDraftError && draftError && currentClassifiedId) {
      if (draftError.message?.includes('erişim yetkiniz yok')) {
        navigate('/create-listing/step-1');
      } 
      else if (draftError.message?.includes('bulunamadı')) {
        navigate('/create-listing/step-1');
      }
      else {
        navigate('/create-listing/step-1');
      }
    }
  }, [isDraftError, draftError, currentClassifiedId, navigate]);
  
  // Location selection state
  const [selectedCountry, setSelectedCountry] = useState<Location | null>(null);
  const [selectedCity, setSelectedCity] = useState<Location | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<Location | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Location | null>(null);
  
  // Fetch data
  const { data: locations = [] } = useLocationsTree();
  const { data: locationSettings } = useLocationSettings();
  const { data: allCategories = [] } = useCategoriesTree();
  
  // Build flat categories array for path building
  const flatCategories = useMemo(() => {
    const flatten = (categories: Category[]): Category[] => {
      const result: Category[] = [];
      for (const category of categories) {
        result.push(category);
        if (category.children && category.children.length > 0) {
          result.push(...flatten(category.children));
        }
      }
      return result;
    };
    return flatten(allCategories);
  }, [allCategories]);
  
  // Initialize classifiedId from URL on component mount
  useEffect(() => {
    if (currentClassifiedId && !state.classifiedId) {
      dispatch({ type: 'SET_CLASSIFIED_ID', payload: currentClassifiedId });
      dispatch({ type: 'SET_IS_DRAFT', payload: true });
    }
  }, [currentClassifiedId, state.classifiedId, dispatch]);

  // Load draft data when available and rebuild category path
  useEffect(() => {
    if (draftData && state.classifiedId && allCategories.length > 0) {
      dispatch({ 
        type: 'LOAD_DRAFT', 
        payload: { 
          classifiedId: state.classifiedId, 
          draft: draftData 
        } 
      });
      
      if (draftData.customFields) {
        try {
          const customFields = JSON.parse(draftData.customFields);
          dispatch({ type: 'SET_CUSTOM_FIELDS', payload: customFields });
        } catch (error) {
          console.error('Custom fields parse error:', error);
        }
      }
      
      if (draftData.categoryId) {
        const buildCategoryPath = (categoryId: number): Category[] => {
          const path: Category[] = [];
          let currentId = categoryId;
          
          while (currentId) {
            const category = flatCategories.find(c => c.id === currentId);
            if (category) {
              path.unshift(category);
              currentId = category.parentId || 0;
            } else {
              break;
            }
          }
          return path;
        };
        
        const category = flatCategories.find(c => c.id === draftData.categoryId);
        const path = buildCategoryPath(draftData.categoryId);
        
        if (category && path.length > 0) {
          dispatch({ 
            type: 'SET_CATEGORY', 
            payload: { category, path } 
          });
        }
      }
      
      if (draftData.locationData) {
        try {
          const locationData = JSON.parse(draftData.locationData);
          if (locationData.country) setSelectedCountry(locationData.country);
          if (locationData.city) setSelectedCity(locationData.city);
          if (locationData.district) setSelectedDistrict(locationData.district);
          if (locationData.neighborhood) setSelectedNeighborhood(locationData.neighborhood);
        } catch (error) {
          console.error('Location data parse error:', error);
        }
      }
    }
  }, [draftData, state.classifiedId, allCategories, flatCategories, dispatch]);
  
  // Get available locations based on selection
  const availableCountries = useMemo(() => {
    return locations.filter(loc => loc.type === 'country');
  }, [locations]);
  
  const availableCities = useMemo(() => {
    if (!selectedCountry) return [];
    const findChildren = (locs: any[], parentId: number): any[] => {
      for (const loc of locs) {
        if (loc.id === parentId) {
          return loc.children || [];
        }
        if (loc.children) {
          const found = findChildren(loc.children, parentId);
          if (found.length > 0) return found;
        }
      }
      return [];
    };
    return findChildren(locations, selectedCountry.id).filter((loc: any) => loc.type === 'city');
  }, [locations, selectedCountry]);
  
  const availableDistricts = useMemo(() => {
    if (!selectedCity) return [];
    const findChildren = (locs: any[], parentId: number): any[] => {
      for (const loc of locs) {
        if (loc.id === parentId) {
          return loc.children || [];
        }
        if (loc.children) {
          const found = findChildren(loc.children, parentId);
          if (found.length > 0) return found;
        }
      }
      return [];
    };
    return findChildren(locations, selectedCity.id).filter((loc: any) => loc.type === 'district');
  }, [locations, selectedCity]);

  const availableNeighborhoods = useMemo(() => {
    if (!selectedDistrict) return [];
    const findChildren = (locs: any[], parentId: number): any[] => {
      for (const loc of locs) {
        if (loc.id === parentId) {
          return loc.children || [];
        }
        if (loc.children) {
          const found = findChildren(loc.children, parentId);
          if (found.length > 0) return found;
        }
      }
      return [];
    };
    return findChildren(locations, selectedDistrict.id).filter((loc: any) => loc.type === 'neighborhood');
  }, [locations, selectedDistrict]);

  // Auto-select default country when visibility is disabled
  useEffect(() => {
    if (locationSettings && !locationSettings.showCountry && availableCountries.length > 0 && !selectedCountry) {
      const defaultCountry = availableCountries[0];
      setSelectedCountry(defaultCountry);
      updateFormData({
        location: {
          country: defaultCountry,
          city: null,
          district: null
        }
      });
    }
  }, [locationSettings, availableCountries, selectedCountry]);
  
  const updateFormData = (newData: any) => {
    dispatch({ type: 'SET_CUSTOM_FIELDS', payload: { ...formData.customFields, ...newData } });
  };

  const nextStep = async () => {
    updateFormData({});

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
        
        if (user?.id) {
          prefetchStep3Data(currentClassifiedId, user.id);
        }
      } catch (error) {
        console.error('Draft güncellenemedi:', error);
      }
    }
    
    dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    const url = currentClassifiedId ? 
      `/create-listing/step-3?classifiedId=${currentClassifiedId}` : 
      '/create-listing/step-3';
    navigate(url);
  };

  // Get categoryId from draft or selected category for custom fields
  const categoryIdForFields = draftData?.categoryId || selectedCategory?.id || 0;
  const { data: customFields = [], isLoading: fieldsLoading } = useCategoryCustomFields(categoryIdForFields);

  // Final loading check
  if (authLoading || isDraftLoading || fieldsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <IOSSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Category info box */}
        <div className="mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-2">Seçtiğiniz Araca Ait Bilgiler</div>
                <div className="lg:block hidden">
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

        {/* Form content */}
        <div className="mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-medium text-gray-900 text-md leading-tight mb-6">
              İlan Detayları
            </h3>

            {/* Title input */}
            <div className="space-y-2 mb-6">
              <label className="block text-sm font-medium text-gray-700">
                İlan Başlığı
              </label>
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
                className="py-2.5 sm:py-3 px-4 block w-full rounded-lg sm:text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            {/* Description input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama
              </label>
              <RichTextEditor
                value={formData.customFields.description || ''}
                onChange={handleDescriptionChange}
                placeholder="Ürününüzün detaylı açıklamasını yazınız..."
                maxLength={2000}
              />
            </div>

            {/* Price input */}
            <div className="space-y-2 mb-6">
              <label className="block text-sm font-medium text-gray-700">
                Fiyat
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
                  className="py-2.5 sm:py-3 px-4 pe-20 block w-full rounded-lg sm:text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500"
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

            {/* Custom fields */}
            {customFields && customFields.length > 0 && (
              <div className="space-y-6">
                {customFields.map((field) => {
                  const currentValue = formData.customFields[field.fieldName] || '';
                  
                  return (
                    <div key={field.id} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                      
                      {field.fieldType === 'text' && (
                        <input
                          type="text"
                          value={typeof currentValue === 'object' ? currentValue.value || '' : currentValue}
                          onChange={(e) => {
                            handleInputChange(field.fieldName, e.target.value);
                          }}
                          placeholder={field.placeholder || ''}
                          className="py-2.5 sm:py-3 px-4 block w-full lg:w-[30%] rounded-lg sm:text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                        />
                      )}

                      {field.fieldType === 'select' && (
                        <select
                          value={currentValue}
                          onChange={(e) => {
                            handleInputChange(field.fieldName, e.target.value);
                          }}
                          className="py-2.5 sm:py-3 px-4 pe-9 block w-full lg:w-[30%] rounded-lg sm:text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                        >
                          <option value="">Seçiniz</option>
                          {field.options && JSON.parse(field.options).map((option: string, index: number) => (
                            <option key={index} value={option}>{option}</option>
                          ))}
                        </select>
                      )}

                      {field.fieldType === 'number' && (
                        <input
                          type="number"
                          value={typeof currentValue === 'object' ? currentValue.value || '' : currentValue}
                          onChange={(e) => {
                            handleInputChange(field.fieldName, e.target.value);
                          }}
                          placeholder={field.placeholder || ''}
                          className="py-2.5 sm:py-3 px-4 block w-full lg:w-[30%] rounded-lg sm:text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                        />
                      )}

                      {field.fieldType === 'checkbox' && (
                        <select
                          value={currentValue}
                          onChange={(e) => {
                            handleInputChange(field.fieldName, e.target.value);
                          }}
                          className="py-2.5 sm:py-3 px-4 pe-9 block w-full lg:w-[30%] rounded-lg sm:text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                        >
                          <option value="">Seçiniz</option>
                          <option value="Evet">Evet</option>
                          <option value="Hayır">Hayır</option>
                        </select>
                      )}

                      {field.fieldType === 'boolean' && (
                        <select
                          value={currentValue}
                          onChange={(e) => {
                            handleInputChange(field.fieldName, e.target.value);
                          }}
                          className="py-2.5 sm:py-3 px-4 pe-9 block w-full lg:w-[30%] rounded-lg sm:text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500"
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

            {/* Location settings */}
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Konum Bilgileri</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Country */}
                {locationSettings?.showCountry && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ülke
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
                      className="py-2.5 sm:py-3 px-4 pe-9 block w-full rounded-lg sm:text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500"
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

                {/* City */}
                {locationSettings?.showCity && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      İl
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
                            country: selectedCountry,
                            city: city || null,
                            district: null,
                            neighborhood: null
                          }
                        });
                      }}
                      disabled={locationSettings?.showCountry ? !selectedCountry : false}
                      className="py-2.5 sm:py-3 px-4 pe-9 block w-full rounded-lg sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    >
                      <option value="">
                        {(locationSettings?.showCountry && !selectedCountry) ? "Önce ülke seçiniz" : "İl seçiniz"}
                      </option>
                      {availableCities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* District */}
                {locationSettings?.showDistrict && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      İlçe
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
                            country: selectedCountry,
                            city: selectedCity,
                            district: district || null,
                            neighborhood: null
                          }
                        });
                      }}
                      disabled={locationSettings?.showCity ? !selectedCity : false}
                      className="py-2.5 sm:py-3 px-4 pe-9 block w-full rounded-lg sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    >
                      <option value="">
                        {(locationSettings?.showCity && !selectedCity) ? "Önce il seçiniz" : "İlçe seçiniz"}
                      </option>
                      {availableDistricts.map((district) => (
                        <option key={district.id} value={district.id}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Neighborhood */}
                {locationSettings?.showNeighborhood && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mahalle
                    </label>
                    <select
                      value={selectedNeighborhood?.id || ''}
                      onChange={(e) => {
                        const neighborhoodId = parseInt(e.target.value);
                        const neighborhood = availableNeighborhoods.find(n => n.id === neighborhoodId);
                        setSelectedNeighborhood(neighborhood || null);
                        updateFormData({
                          location: {
                            country: selectedCountry,
                            city: selectedCity,
                            district: selectedDistrict,
                            neighborhood: neighborhood || null
                          }
                        });
                      }}
                      disabled={locationSettings?.showDistrict ? !selectedDistrict : false}
                      className="py-2.5 sm:py-3 px-4 pe-9 block w-full rounded-lg sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    >
                      <option value="">
                        {(locationSettings?.showDistrict && !selectedDistrict) ? "Önce ilçe seçiniz" : "Mahalle seçiniz"}
                      </option>
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

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={nextStep}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Sonraki Adım
          </button>
        </div>
        
        <PageLoadIndicator />
      </div>
    </div>
  );
}