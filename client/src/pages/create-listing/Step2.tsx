import React, { useState, useEffect } from 'react';
import { useListing } from '@/contexts/ListingContext';
import { useLocation } from 'wouter';
import { useCustomFields } from '@/hooks/useCustomFields';

import ProgressBar from '@/components/listing/ProgressBar';
import BreadcrumbNav from '@/components/listing/BreadcrumbNav';
import ModernNavbar from '@/components/Navbar';
import NavbarMobile from '@/components/Navbar-mobile';

export default function CreateListingStep2() {
  const [, navigate] = useLocation();
  const { state, dispatch } = useListing();
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Get custom fields for selected category
  const { data: customFields = [], isLoading } = useCustomFields(
    state.selectedCategory?.id || 0
  );

  // Redirect if no category selected
  useEffect(() => {
    if (!state.selectedCategory) {
      navigate('/create-listing/step-1');
    }
  }, [state.selectedCategory, navigate]);

  // Initialize form data with existing custom fields data
  useEffect(() => {
    if (customFields.length > 0) {
      const initialData = { ...state.formData.customFields };
      
      // Set default values for fields if not already set
      customFields.forEach(field => {
        if (!(field.id.toString() in initialData)) {
          if (field.defaultUnit && field.unitOptions?.length > 0) {
            initialData[field.id.toString()] = {
              value: '',
              unit: field.defaultUnit
            };
          } else {
            initialData[field.id.toString()] = '';
          }
        }
      });
      
      setFormData(initialData);
    }
  }, [customFields, state.formData.customFields]);

  // Handle input changes
  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Handle form submission
  const handleNext = () => {
    // Save custom fields data to context
    dispatch({ type: 'SET_CUSTOM_FIELDS', payload: formData });
    
    // Navigate to step 3
    dispatch({ type: 'SET_STEP', payload: 3 });
    navigate('/create-listing/step-3');
  };

  // Handle back to step 1
  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 1 });
    navigate('/create-listing/step-1');
  };

  // Render form field based on type
  const renderField = (field: any) => {
    const fieldId = field.id.toString();
    const currentValue = formData[fieldId];

    switch (field.fieldType) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.displayName}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {field.hasUnits && field.unitOptions?.length > 0 ? (
              <div className="relative">
                <input
                  type="text"
                  value={currentValue?.value || ''}
                  onChange={(e) => handleInputChange(fieldId, {
                    ...currentValue,
                    value: e.target.value
                  })}
                  placeholder={field.placeholder || ''}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 pe-20"
                />
                <select
                  value={currentValue?.unit || field.defaultUnit || ''}
                  onChange={(e) => handleInputChange(fieldId, {
                    ...currentValue,
                    unit: e.target.value
                  })}
                  disabled={field.unitOptions.length === 1}
                  className="absolute inset-y-0 right-0 w-32 px-2 py-2 bg-white border-l border-gray-300 text-sm focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {field.unitOptions.map((unit: string) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            ) : (
              <input
                type="text"
                value={currentValue || ''}
                onChange={(e) => handleInputChange(fieldId, e.target.value)}
                placeholder={field.placeholder || ''}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              />
            )}
            
            {field.description && (
              <p className="text-sm text-gray-500">{field.description}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.displayName}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {field.hasUnits && field.unitOptions?.length > 0 ? (
              <div className="relative">
                <input
                  type="number"
                  value={currentValue?.value || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = parseFloat(value);
                    
                    // Check min/max limits
                    if (field.minValue !== null && numValue < field.minValue) return;
                    if (field.maxValue !== null && numValue > field.maxValue) return;
                    
                    handleInputChange(fieldId, {
                      ...currentValue,
                      value: value
                    });
                  }}
                  min={field.minValue || undefined}
                  max={field.maxValue || undefined}
                  placeholder={field.placeholder || ''}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 pe-20"
                />
                <select
                  value={currentValue?.unit || field.defaultUnit || ''}
                  onChange={(e) => handleInputChange(fieldId, {
                    ...currentValue,
                    unit: e.target.value
                  })}
                  disabled={field.unitOptions.length === 1}
                  className="absolute inset-y-0 right-0 w-32 px-2 py-2 bg-white border-l border-gray-300 text-sm focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {field.unitOptions.map((unit: string) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            ) : (
              <input
                type="number"
                value={currentValue || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = parseFloat(value);
                  
                  // Check min/max limits
                  if (field.minValue !== null && numValue < field.minValue) return;
                  if (field.maxValue !== null && numValue > field.maxValue) return;
                  
                  handleInputChange(fieldId, value);
                }}
                min={field.minValue || undefined}
                max={field.maxValue || undefined}
                placeholder={field.placeholder || ''}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              />
            )}
            
            {(field.minValue !== null || field.maxValue !== null) && (
              <p className="text-sm text-gray-500">
                {field.minValue !== null && field.maxValue !== null
                  ? `${field.minValue} - ${field.maxValue} arasında`
                  : field.minValue !== null
                  ? `Minimum: ${field.minValue}`
                  : `Maksimum: ${field.maxValue}`}
              </p>
            )}
            
            {field.description && (
              <p className="text-sm text-gray-500">{field.description}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.displayName}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            <select
              value={currentValue || ''}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Seçiniz...</option>
              {field.selectOptions?.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            
            {field.description && (
              <p className="text-sm text-gray-500">{field.description}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.displayName}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            <div className="space-y-2">
              {field.selectOptions?.map((option: string) => (
                <label key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(currentValue || []).includes(option)}
                    onChange={(e) => {
                      const currentArray = currentValue || [];
                      const newArray = e.target.checked
                        ? [...currentArray, option]
                        : currentArray.filter((item: string) => item !== option);
                      handleInputChange(fieldId, newArray);
                    }}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            
            {field.description && (
              <p className="text-sm text-gray-500">{field.description}</p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={field.id} className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={currentValue || false}
                onChange={(e) => handleInputChange(fieldId, e.target.checked)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                {field.displayName}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
            
            {field.description && (
              <p className="text-sm text-gray-500">{field.description}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!state.selectedCategory) {
    return <div>Kategori seçimi yapılmamış...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navbar */}
      <div className="hidden lg:block">
        <ModernNavbar />
      </div>
      
      {/* Mobile Navbar */}
      <div className="lg:hidden">
        <NavbarMobile 
          title="İlan Detayları" 
          showBack={true}
          onBackClick={handleBack}
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ProgressBar currentStep={2} totalSteps={7} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <BreadcrumbNav 
            categoryPath={state.categoryPath}
            onCategoryClick={() => {}} // Read-only in step 2
          />
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            İlan Detayları
          </h1>
          <p className="text-gray-600">
            {state.selectedCategory.name} kategorisi için gerekli bilgileri doldurun.
          </p>
        </div>

        {/* Custom Fields Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-3 text-gray-600">Yükleniyor...</span>
            </div>
          ) : customFields.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                Bu kategori için özel alan bulunmuyor.
              </p>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Sonraki Adıma Geç
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Kategori Bilgileri
              </h2>
              
              {/* Render all custom fields */}
              {customFields.map(field => renderField(field))}
              
              {/* Navigation Buttons */}
              <div className="pt-6 border-t border-gray-200 flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Geri Dön
                </button>
                
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Devam Et
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}