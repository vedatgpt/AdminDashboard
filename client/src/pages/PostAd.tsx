import React, { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useCustomFields } from "@/hooks/useCustomFields";
import { Link } from "wouter";
import type { Category, CategoryCustomField } from "@shared/schema";

interface CategoryStep {
  category: Category;
  level: number;
}

export default function PostAd() {
  const [selectedPath, setSelectedPath] = useState<CategoryStep[]>([]);
  const [finalCategory, setFinalCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: allCategories = [] } = useCategories();
  const { data: customFields = [] } = useCustomFields(finalCategory?.id);
  
  // Fetch category path with labels for final category
  const { data: categoryPath = [] } = useQuery({
    queryKey: ['/api/categories', finalCategory?.id, 'path'],
    enabled: !!finalCategory?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Flatten nested categories to a flat array
  const flatCategories = React.useMemo(() => {
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

  // Debug: Log categories data
  useEffect(() => {
    console.log("All categories:", allCategories);
    console.log("Flat categories:", flatCategories);
    console.log("Selected path:", selectedPath);
    console.log("Current level categories:", getCurrentLevelCategories());
  }, [allCategories, selectedPath, flatCategories]);

  // Get current level categories
  const getCurrentLevelCategories = (): Category[] => {
    if (selectedPath.length === 0) {
      // Root level categories
      return flatCategories.filter(cat => !cat.parentId);
    }
    
    const currentParent = selectedPath[selectedPath.length - 1].category;
    return flatCategories.filter(cat => cat.parentId === currentParent.id);
  };

  // Check if category has children
  const hasChildren = (categoryId: number): boolean => {
    return flatCategories.some(cat => cat.parentId === categoryId);
  };

  // Handle category selection
  const handleCategorySelect = (category: Category) => {
    const newStep: CategoryStep = {
      category,
      level: selectedPath.length
    };

    const newPath = [...selectedPath, newStep];
    setSelectedPath(newPath);

    // Only set as final category if it has no children
    // This way we continue navigation until we reach a leaf category
    if (!hasChildren(category.id)) {
      setFinalCategory(category);
    } else {
      setFinalCategory(null);
    }
  };

  // Go back to previous level
  const goBackToLevel = (level: number) => {
    const newPath = selectedPath.slice(0, level);
    setSelectedPath(newPath);
    setFinalCategory(null);
  };

  // Handle custom field input changes
  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Handle unit selection for fields with units
  const handleUnitChange = (fieldName: string, unit: string) => {
    const currentValue = formData[fieldName] || {};
    const newValue = typeof currentValue === 'object' && currentValue !== null 
      ? { ...currentValue, unit } 
      : { value: currentValue || '', unit };
    
    handleCustomFieldChange(fieldName, newValue);
  };

  // Handle value change for fields with units
  const handleValueWithUnitChange = (fieldName: string, value: string) => {
    const currentData = formData[fieldName] || {};
    const newValue = typeof currentData === 'object' && currentData !== null
      ? { ...currentData, value }
      : { value, unit: currentData.unit || '' };
    
    handleCustomFieldChange(fieldName, newValue);
  };

  // Format number with thousand separators
  const formatWithThousands = (num: string): string => {
    const cleaned = num.replace(/\D/g, '');
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Handle numeric input (for number field type)
  const handleNumericInput = (fieldName: string, value: string, field: CategoryCustomField) => {
    const fieldData = field as any;
    
    // Always remove non-numeric characters for number field type
    const processedValue = value.replace(/\D/g, '');

    // Store raw numeric value in form data
    handleCustomFieldChange(fieldName, processedValue);
  };

  // Render custom field input based on type
  const renderCustomField = (field: CategoryCustomField) => {
    const fieldData = field as any;
    const rawValue = formData[field.fieldName] || "";
    
    // Handle unit fields - value might be object with {value, unit} structure
    let value = rawValue;
    let selectedUnit = "";
    
    if (fieldData.hasUnits && typeof rawValue === 'object' && rawValue !== null) {
      value = rawValue.value || "";
      selectedUnit = rawValue.unit || fieldData.defaultUnit || "";
    } else if (fieldData.hasUnits) {
      // Initialize unit data for existing fields
      selectedUnit = fieldData.defaultUnit || "";
      if (rawValue) {
        value = rawValue;
        handleCustomFieldChange(field.fieldName, { value: rawValue, unit: selectedUnit });
      }
    }

    // Prepare input attributes for numeric fields
    const numericInputProps = field.fieldType === "number" ? {
      inputMode: fieldData.useMobileNumericKeyboard ? "numeric" as const : undefined,
      pattern: fieldData.useMobileNumericKeyboard ? "[0-9]*" : undefined,
    } : {};

    // Render input with or without unit selector using Preline UI design
    const renderInputWithUnit = (inputElement: React.ReactNode, isNumberField = false) => {
      if (!fieldData.hasUnits) return inputElement;
      
      const unitOptions = fieldData.unitOptions ? JSON.parse(fieldData.unitOptions) : [];
      
      return (
        <div className="relative">
          <input
            type="text"
            className="py-2.5 px-4 pe-20 block w-full border-gray-200 rounded-lg text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500 disabled:opacity-50 disabled:pointer-events-none"
            placeholder={field.placeholder || ""}
            value={isNumberField ? (fieldData.useThousandSeparator ? formatWithThousands(value) : value) : value}
            onChange={(e) => {
              if (isNumberField) {
                let processedValue = e.target.value.replace(/\D/g, '');
                
                // Apply min/max validation - prevent exceeding limits
                if (processedValue && fieldData.maxValue !== null && parseInt(processedValue) > fieldData.maxValue) {
                  return; // Don't allow input beyond max value
                }
                if (processedValue && fieldData.minValue !== null && parseInt(processedValue) < fieldData.minValue && processedValue.length >= fieldData.minValue.toString().length) {
                  return; // Don't allow input below min value once reaching min digits
                }
                
                handleValueWithUnitChange(field.fieldName, processedValue);
              } else {
                handleValueWithUnitChange(field.fieldName, e.target.value);
              }
            }}
            {...(isNumberField ? numericInputProps : {})}
          />
          <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
            <select
              value={selectedUnit}
              onChange={(e) => handleUnitChange(field.fieldName, e.target.value)}
              disabled={unitOptions.length <= 1}
              className={`block w-full border-transparent rounded-lg focus:ring-orange-600 focus:border-orange-600 text-gray-500 ${
                unitOptions.length <= 1 ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
              }`}
            >
              {unitOptions.map((unit: string, index: number) => (
                <option key={index} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    };

    switch (field.fieldType) {
      case "text":
        // For text fields with units, use Preline inline design
        if (fieldData.hasUnits) {
          return renderInputWithUnit(null, false);
        }
        
        // For text fields without units, use regular input
        return (
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
          />
        );

      case "number":
        // For number fields with units, use the integrated Preline design
        if (fieldData.hasUnits) {
          return renderInputWithUnit(null, true);
        }
        
        // For number fields without units, use regular input
        const displayValue = fieldData.useThousandSeparator 
          ? formatWithThousands(value) 
          : value;

        return (
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder={field.placeholder || ""}
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
              
              handleCustomFieldChange(field.fieldName, processedValue);
            }}
            {...numericInputProps}
          />
        );

      case "select":
        const options = field.options ? JSON.parse(field.options) : [];
        
        // For select fields with units, use Preline inline design
        if (fieldData.hasUnits) {
          const unitOptions = fieldData.unitOptions ? JSON.parse(fieldData.unitOptions) : [];
          
          return (
            <div className="relative">
              <select
                className="py-2.5 px-4 pe-20 block w-full border-gray-200 rounded-lg text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                value={value}
                onChange={(e) => handleValueWithUnitChange(field.fieldName, e.target.value)}
              >
                <option value="">{field.placeholder || "Seçiniz"}</option>
                {options.map((option: string, index: number) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
                <select
                  value={selectedUnit}
                  onChange={(e) => handleUnitChange(field.fieldName, e.target.value)}
                  disabled={unitOptions.length <= 1}
                  className={`block w-full border-transparent rounded-lg focus:ring-orange-600 focus:border-orange-600 text-gray-500 ${
                    unitOptions.length <= 1 ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                >
                  {unitOptions.map((unit: string, index: number) => (
                    <option key={index} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        }
        
        // For select fields without units, use regular select
        return (
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
          >
            <option value="">{field.placeholder || "Seçiniz"}</option>
            {options.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "number_range":
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Min"
              value={value.min || ""}
              onChange={(e) => handleCustomFieldChange(field.fieldName, {
                ...value,
                min: e.target.value
              })}
            />
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Max"
              value={value.max || ""}
              onChange={(e) => handleCustomFieldChange(field.fieldName, {
                ...value,
                max: e.target.value
              })}
            />
          </div>
        );

      case "checkbox":
        const checkboxOptions = field.options ? JSON.parse(field.options) : [];
        return (
          <div className="space-y-2">
            {checkboxOptions.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${field.fieldName}-${index}`}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  checked={(value || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = value || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v: string) => v !== option);
                    handleCustomFieldChange(field.fieldName, newValues);
                  }}
                />
                <label htmlFor={`${field.fieldName}-${index}`} className="text-sm font-medium">
                  {option}
                </label>
              </div>
            ))}
          </div>
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.fieldName}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              checked={value || false}
              onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.checked)}
            />
            <label htmlFor={field.fieldName} className="text-sm font-medium">
              {field.label}
            </label>
          </div>
        );

      default:
        return (
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
          />
        );
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <button className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center">
              ← Ana Sayfa
            </button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            İlan Ver (Test Sayfası)
          </h1>
          <p className="text-gray-600 mt-2">
            Bu sayfa kategori ve özel alanların test edilmesi için geçici olarak oluşturulmuştur.
          </p>
        </div>

        {/* Category Selection */}
        <div className="bg-white rounded-lg border shadow-sm max-w-4xl mx-auto">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Kategori Seçimi</h2>
            {selectedPath.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                <span>Seçilen:</span>
                {selectedPath.map((step, index) => (
                  <div key={index} className="flex items-center">
                    <button
                      onClick={() => goBackToLevel(index)}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {step.category.name}
                    </button>
                    {index < selectedPath.length - 1 && (
                      <span className="mx-1">→</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {getCurrentLevelCategories().map((category) => (
                <button
                  key={category.id}
                  className="p-4 text-left border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  onClick={() => handleCategorySelect(category)}
                >
                  <div>
                    <div className="font-medium">{category.name}</div>
                    {category.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {category.description}
                      </div>
                    )}
                  </div>
                  {hasChildren(category.id) && (
                    <span className="float-right">→</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Info */}
        {selectedPath.length > 0 && !finalCategory && (
          <div className="bg-white rounded-lg border shadow-sm max-w-4xl mx-auto mt-6">
            <div className="p-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-medium text-blue-800 mb-2">Kategori Seçimi Devam Ediyor</h3>
                <p className="text-blue-700 text-sm">
                  Şu anda <strong>{selectedPath[selectedPath.length - 1].category.name}</strong> kategorisinin alt kategorilerini görüyorsunuz. 
                  Devam etmek için bir alt kategori seçin.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Final Category Custom Fields Display */}
        {finalCategory && (
          <div className="bg-white rounded-lg border shadow-sm max-w-4xl mx-auto mt-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {finalCategory.name} - Son Kategori Seçildi
              </h2>

              {customFields.length > 0 && (
                <>
                  <h3 className="text-lg font-medium mb-4">Özel Alanlar</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {customFields.map((field) => (
                      <div key={field.id} className="border border-gray-200 rounded-md p-4">
                        <div className="font-medium text-gray-900 mb-2">
                          {field.label}
                          {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Tip: {field.fieldType}
                        </div>
                        {field.placeholder && (
                          <div className="text-sm text-gray-500 mb-2">
                            Placeholder: {field.placeholder}
                          </div>
                        )}
                        {field.options && (
                          <div className="text-sm text-gray-500">
                            Seçenekler: {field.options}
                          </div>
                        )}
                        {/* Demo input for testing */}
                        <div className="mt-3">
                          {renderCustomField(field)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <h3 className="font-medium text-green-800 mb-2">Test Başarılı!</h3>
                    <p className="text-green-700 text-sm">
                      Kategori seçimi tamamlandı ve özel alanlar başarıyla yüklendi. 
                      Yukarıdaki alanları test edebilirsiniz.
                    </p>
                  </div>
                </>
              )}

              {customFields.length === 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <h3 className="font-medium text-gray-800 mb-2">Özel Alan Bulunamadı</h3>
                  <p className="text-gray-700 text-sm">
                    Bu kategori ve üst kategorilerinde henüz özel alan tanımlanmamış. 
                    Kategori seçimi başarıyla çalışıyor.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}