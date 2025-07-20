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
          if (field.defaultUnit && Array.isArray(field.unitOptions) && field.unitOptions?.length > 0) {
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

  // Render form field based on type (using PostAd.tsx working implementation)
  const renderField = (field: any) => {
    const fieldId = field.id.toString();
    const currentValue = formData[fieldId];

    // Parse JSON fields like PostAd.tsx does
    const unitOptions = field.unitOptions ? JSON.parse(field.unitOptions) : [];
    const selectOptions = field.selectOptions ? JSON.parse(field.selectOptions) : [];

    return (
      <div key={field.id} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.displayName || field.fieldName}
          {field.isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {(() => {
          switch (field.fieldType) {
            case 'text':
              if (field.hasUnits && unitOptions.length > 0) {
                return (
                  <div className="relative">
                    <input
                      type="text"
                      value={currentValue?.value || ''}
                      onChange={(e) => handleInputChange(fieldId, {
                        ...currentValue,
                        value: e.target.value
                      })}
                      placeholder={field.placeholder || ''}
                      className="py-2.5 px-4 pe-20 block w-full border-gray-200 rounded-lg text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                    />
                    <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
                      <select
                        value={currentValue?.unit || field.defaultUnit || ''}
                        onChange={(e) => handleInputChange(fieldId, {
                          ...currentValue,
                          unit: e.target.value
                        })}
                        disabled={unitOptions.length <= 1}
                        className={`block w-full border-transparent rounded-lg focus:ring-orange-600 focus:border-orange-600 text-gray-500 ${
                          unitOptions.length <= 1 ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                        }`}
                      >
                        {unitOptions.map((unit: string, index: number) => (
                          <option key={index} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              }
              return (
                <input
                  type="text"
                  value={currentValue || ''}
                  onChange={(e) => handleInputChange(fieldId, e.target.value)}
                  placeholder={field.placeholder || ''}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                />
              );

            case 'number':
              if (field.hasUnits && unitOptions.length > 0) {
                return (
                  <div className="relative">
                    <input
                      type="text"
                      value={currentValue?.value || ''}
                      onChange={(e) => {
                        let processedValue = e.target.value.replace(/\D/g, '');
                        
                        // Apply min/max validation - prevent exceeding limits
                        if (processedValue && field.maxValue !== null && parseInt(processedValue) > field.maxValue) {
                          return; // Don't allow input beyond max value
                        }
                        if (processedValue && field.minValue !== null && parseInt(processedValue) < field.minValue && processedValue.length >= field.minValue.toString().length) {
                          return; // Don't allow input below min value once reaching min digits
                        }
                        
                        handleInputChange(fieldId, {
                          ...currentValue,
                          value: processedValue
                        });
                      }}
                      placeholder={field.placeholder || ''}
                      className="py-2.5 px-4 pe-20 block w-full border-gray-200 rounded-lg text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                    />
                    <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
                      <select
                        value={currentValue?.unit || field.defaultUnit || ''}
                        onChange={(e) => handleInputChange(fieldId, {
                          ...currentValue,
                          unit: e.target.value
                        })}
                        disabled={unitOptions.length <= 1}
                        className={`block w-full border-transparent rounded-lg focus:ring-orange-600 focus:border-orange-600 text-gray-500 ${
                          unitOptions.length <= 1 ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                        }`}
                      >
                        {unitOptions.map((unit: string, index: number) => (
                          <option key={index} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              }
              return (
                <input
                  type="text"
                  value={currentValue || ''}
                  onChange={(e) => {
                    let processedValue = e.target.value.replace(/\D/g, '');
                    
                    // Apply min/max validation - prevent exceeding limits
                    if (processedValue && field.maxValue !== null && parseInt(processedValue) > field.maxValue) {
                      return; // Don't allow input beyond max value
                    }
                    if (processedValue && field.minValue !== null && parseInt(processedValue) < field.minValue && processedValue.length >= field.minValue.toString().length) {
                      return; // Don't allow input below min value once reaching min digits
                    }
                    
                    handleInputChange(fieldId, processedValue);
                  }}
                  placeholder={field.placeholder || ''}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                />
              );

            case 'select':
              return (
                <select
                  value={currentValue || ''}
                  onChange={(e) => handleInputChange(fieldId, e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">{field.placeholder || "Seçiniz"}</option>
                  {selectOptions.map((option: string, index: number) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              );

            case 'checkbox':
              return (
                <div className="space-y-2">
                  {selectOptions.map((option: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`${fieldId}-${index}`}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        checked={(currentValue || []).includes(option)}
                        onChange={(e) => {
                          const currentValues = currentValue || [];
                          const newValues = e.target.checked
                            ? [...currentValues, option]
                            : currentValues.filter((v: string) => v !== option);
                          handleInputChange(fieldId, newValues);
                        }}
                      />
                      <label htmlFor={`${fieldId}-${index}`} className="text-sm font-medium">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              );

            case 'boolean':
              return (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={fieldId}
                    checked={currentValue || false}
                    onChange={(e) => handleInputChange(fieldId, e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor={fieldId} className="text-sm font-medium">
                    {field.displayName || field.fieldName}
                  </label>
                </div>
              );

            default:
              return <p className="text-red-500">Desteklenmeyen field türü: {field.fieldType}</p>;
          }
        })()}
        
        {field.description && (
          <p className="text-sm text-gray-500">{field.description}</p>
        )}
        
        {/* Min/Max info for number fields */}
        {field.fieldType === 'number' && (field.minValue !== null || field.maxValue !== null) && (
          <p className="text-sm text-gray-500">
            {field.minValue !== null && field.maxValue !== null
              ? `${field.minValue} - ${field.maxValue} arasında`
              : field.minValue !== null
              ? `Minimum: ${field.minValue}`
              : `Maksimum: ${field.maxValue}`}
          </p>
        )}
      </div>
    );
  };

  if (!state.selectedCategory) {
    return <div>Kategori seçimi yapılmamış...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Step 2 - Custom Fields</h1>

        {/* Custom Fields Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
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
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                {state.selectedCategory?.name} - Kategori Bilgileri
              </h2>
              
              {/* Render all custom fields */}
              {customFields.map(field => renderField(field))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}