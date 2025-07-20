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

  // Helper functions from PostAd.tsx
  const formatWithThousands = (value: any): string => {
    if (!value || typeof value !== 'string') return '';
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Render form field based on type (using PostAd.tsx working implementation)
  const renderField = (field: any) => {
    const fieldId = field.id.toString();
    const currentValue = formData[fieldId];
    
    // Handle different value types properly
    let value = '';
    let selectedUnit = '';
    
    if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
      // Object with value/unit structure
      value = currentValue.value || '';
      selectedUnit = currentValue.unit || field.defaultUnit || '';
    } else if (Array.isArray(currentValue)) {
      // Array for checkbox fields
      value = currentValue;
    } else {
      // Simple string/number value
      value = currentValue || '';
      selectedUnit = field.defaultUnit || '';
    }

    // Get field data like PostAd.tsx - using field directly
    const fieldData = field;

    // Parse JSON fields like PostAd.tsx does - use correct field names
    const unitOptions = fieldData.unitOptions ? JSON.parse(fieldData.unitOptions) : [];
    const selectOptions = fieldData.selectOptions ? JSON.parse(fieldData.selectOptions) : [];
    
    // For select fields, also check field.options (PostAd uses this)
    const options = field.options ? JSON.parse(field.options) : selectOptions;

    // Numeric input props for mobile
    const numericInputProps = {
      inputMode: 'numeric' as const,
      pattern: '[0-9]*',
    };

    // Handle value with unit change (for fields with units)
    const handleValueWithUnitChange = (fieldName: string, newValue: any) => {
      const currentData = formData[fieldName];
      let updatedData;
      
      if (typeof currentData === 'object' && currentData !== null && !Array.isArray(currentData)) {
        updatedData = { ...currentData, value: newValue };
      } else {
        updatedData = { value: newValue, unit: selectedUnit };
      }
      
      handleInputChange(fieldName, updatedData);
    };

    // Handle unit change
    const handleUnitChange = (fieldName: string, unit: string) => {
      const currentData = formData[fieldName];
      let updatedData;
      
      if (typeof currentData === 'object' && currentData !== null && !Array.isArray(currentData)) {
        updatedData = { ...currentData, unit };
      } else {
        updatedData = { value: currentData || '', unit };
      }
      
      handleInputChange(fieldName, updatedData);
    };

    return (
      <div key={field.id} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.displayName || field.fieldName}
          {field.isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {(() => {
          switch (field.fieldType) {
            case 'text':
              if (fieldData.hasUnits && unitOptions.length > 0) {
                return (
                  <div className="relative">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleValueWithUnitChange(fieldId, e.target.value)}
                      placeholder={field.placeholder || ''}
                      className="py-2.5 sm:py-3 px-4 pe-20 block w-full border-gray-200 rounded-lg sm:text-sm text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500 disabled:opacity-50 disabled:pointer-events-none"
                    />
                    <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
                      <label htmlFor={`unit-${fieldId}`} className="sr-only">Unit</label>
                      <select
                        id={`unit-${fieldId}`}
                        value={selectedUnit}
                        onChange={(e) => handleUnitChange(fieldId, e.target.value)}
                        disabled={unitOptions.length <= 1}
                        className={`block w-full border-transparent rounded-lg focus:ring-orange-500 focus:border-orange-500 text-gray-500 ${
                          unitOptions.length <= 1 ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'bg-white'
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
                  value={value}
                  onChange={(e) => handleInputChange(fieldId, e.target.value)}
                  placeholder={field.placeholder || ''}
                  className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:ring-orange-500 disabled:opacity-50 disabled:pointer-events-none"
                />
              );

            case 'number':
              if (fieldData.hasUnits && unitOptions.length > 0) {
                return (
                  <div className="relative">
                    <input
                      type="text"
                      value={fieldData.useThousandSeparator ? formatWithThousands(String(value)) : String(value)}
                      onChange={(e) => {
                        let processedValue = e.target.value.replace(/\D/g, '');
                        
                        // Apply min/max validation - prevent exceeding limits
                        if (processedValue && fieldData.maxValue !== null && parseInt(processedValue) > fieldData.maxValue) {
                          return; // Don't allow input beyond max value
                        }
                        if (processedValue && fieldData.minValue !== null && parseInt(processedValue) < fieldData.minValue && processedValue.length >= fieldData.minValue.toString().length) {
                          return; // Don't allow input below min value once reaching min digits
                        }
                        
                        handleValueWithUnitChange(fieldId, processedValue);
                      }}
                      placeholder={field.placeholder || ''}
                      className="py-2.5 sm:py-3 px-4 pe-20 block w-full border-gray-200 rounded-lg sm:text-sm text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500 disabled:opacity-50 disabled:pointer-events-none"
                      {...numericInputProps}
                    />
                    <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
                      <label htmlFor={`unit-${fieldId}`} className="sr-only">Unit</label>
                      <select
                        id={`unit-${fieldId}`}
                        value={selectedUnit}
                        onChange={(e) => handleUnitChange(fieldId, e.target.value)}
                        disabled={unitOptions.length <= 1}
                        className={`block w-full border-transparent rounded-lg focus:ring-orange-500 focus:border-orange-500 text-gray-500 ${
                          unitOptions.length <= 1 ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'bg-white'
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
              // For number fields without units
              const displayValue = fieldData.useThousandSeparator 
                ? formatWithThousands(String(value)) 
                : String(value);

              return (
                <input
                  type="text"
                  value={displayValue}
                  onChange={(e) => {
                    let processedValue = e.target.value.replace(/\D/g, '');
                    
                    // Apply min/max validation - prevent exceeding limits
                    if (processedValue && fieldData.maxValue !== null && parseInt(processedValue) > fieldData.maxValue) {
                      return; // Don't allow input beyond max value
                    }
                    if (processedValue && fieldData.minValue !== null && parseInt(processedValue) < fieldData.minValue && processedValue.length >= fieldData.minValue.toString().length) {
                      return; // Don't allow input below min value once reaching min digits
                    }
                    
                    handleInputChange(fieldId, processedValue);
                  }}
                  placeholder={field.placeholder || ''}
                  className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:ring-orange-500 disabled:opacity-50 disabled:pointer-events-none"
                  {...numericInputProps}
                />
              );

            case 'select':
              // For select fields with units, use Preline inline design
              if (fieldData.hasUnits && unitOptions.length > 0) {
                return (
                  <div className="relative">
                    <select
                      className="py-2.5 sm:py-3 px-4 pe-20 block w-full border-gray-200 rounded-lg sm:text-sm text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500 disabled:opacity-50 disabled:pointer-events-none"
                      value={value}
                      onChange={(e) => handleValueWithUnitChange(fieldId, e.target.value)}
                    >
                      <option value="">{field.placeholder || "Seçiniz"}</option>
                      {options.map((option: string, index: number) => (
                        <option key={index} value={option}>{option}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
                      <label htmlFor={`unit-${fieldId}`} className="sr-only">Unit</label>
                      <select
                        id={`unit-${fieldId}`}
                        value={selectedUnit}
                        onChange={(e) => handleUnitChange(fieldId, e.target.value)}
                        disabled={unitOptions.length <= 1}
                        className={`block w-full border-transparent rounded-lg focus:ring-orange-500 focus:border-orange-500 text-gray-500 ${
                          unitOptions.length <= 1 ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'bg-white'
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
              
              // For select fields without units, use regular select
              return (
                <select
                  value={value}
                  onChange={(e) => handleInputChange(fieldId, e.target.value)}
                  className="py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:ring-orange-500 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <option value="">{field.placeholder || "Seçiniz"}</option>
                  {options.map((option: string, index: number) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              );

            case 'checkbox':
              const checkboxOptions = options; // Use the same options logic as select
              return (
                <div className="space-y-2">
                  {checkboxOptions.map((option: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`${fieldId}-${index}`}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        checked={Array.isArray(value) ? value.includes(option) : false}
                        onChange={(e) => {
                          const currentValues = Array.isArray(value) ? value : [];
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
                    checked={Boolean(value)}
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