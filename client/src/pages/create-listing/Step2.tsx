import { useListingContext } from '../../contexts/ListingContext';
import { useCustomFields } from '../../hooks/useCustomFields';

export default function Step2() {
  const { selectedCategory, formData, updateFormData, nextStep } = useListingContext();
  const { data: customFields, isLoading } = useCustomFields(selectedCategory?.id || 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-8">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!customFields || customFields.length === 0) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-8">Bu kategori için özel alan bulunmuyor.</div>
          <button
            onClick={nextStep}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Sonraki Adım
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (fieldName: string, value: any) => {
    updateFormData({ ...formData, [fieldName]: value });
  };

  const formatWithThousands = (num: string): string => {
    if (!num) return '';
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleSubmit = () => {
    nextStep();
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">İlan Detayları</h1>
          <p className="text-gray-600">{selectedCategory?.name} kategorisi için gerekli bilgileri doldurun</p>
        </div>

        <div className="space-y-6">
          {customFields.map((field) => {
            const fieldName = field.fieldName;
            const currentValue = formData[fieldName] || '';
            
            // Unit handling
            const hasUnits = field.hasUnits && field.unitOptions;
            const unitOptions = hasUnits ? JSON.parse(field.unitOptions || '[]') : [];
            const selectedUnit = hasUnits && typeof currentValue === 'object' 
              ? currentValue.unit || field.defaultUnit || unitOptions[0]
              : field.defaultUnit || unitOptions[0];
            const displayValue = hasUnits && typeof currentValue === 'object'
              ? currentValue.value || ''
              : currentValue;

            const handleValueWithUnit = (value: string) => {
              if (hasUnits) {
                handleInputChange(fieldName, { value, unit: selectedUnit });
              } else {
                handleInputChange(fieldName, value);
              }
            };

            const handleUnitChange = (unit: string) => {
              const currentData = formData[fieldName];
              const value = typeof currentData === 'object' ? currentData.value || '' : currentData || '';
              handleInputChange(fieldName, { value, unit });
            };

            return (
              <div key={field.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {(() => {
                  switch (field.fieldType) {
                    case 'text':
                      if (hasUnits && unitOptions.length > 0) {
                        return (
                          <div className="relative">
                            <input
                              type="text"
                              value={displayValue}
                              onChange={(e) => handleValueWithUnit(e.target.value)}
                              placeholder={field.placeholder || ''}
                              className="py-2.5 px-4 pe-20 block w-full border-gray-200 rounded-lg text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                            />
                            <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
                              <select
                                value={selectedUnit}
                                onChange={(e) => handleUnitChange(e.target.value)}
                                disabled={unitOptions.length <= 1}
                                className="block w-32 border-transparent bg-transparent text-gray-500 focus:ring-orange-500 focus:border-orange-500"
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
                          value={displayValue}
                          onChange={(e) => handleInputChange(fieldName, e.target.value)}
                          placeholder={field.placeholder || ''}
                          className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:ring-orange-500"
                        />
                      );

                    case 'number':
                      const numericValue = field.useThousandSeparator ? formatWithThousands(String(displayValue)) : String(displayValue);
                      
                      if (hasUnits && unitOptions.length > 0) {
                        return (
                          <div className="relative">
                            <input
                              type="text"
                              value={numericValue}
                              onChange={(e) => {
                                let processedValue = e.target.value.replace(/\D/g, '');
                                
                                if (processedValue && field.maxValue !== null && parseInt(processedValue) > field.maxValue) {
                                  return;
                                }
                                if (processedValue && field.minValue !== null && parseInt(processedValue) < field.minValue && processedValue.length >= field.minValue.toString().length) {
                                  return;
                                }
                                
                                handleValueWithUnit(processedValue);
                              }}
                              placeholder={field.placeholder || ''}
                              className="py-2.5 px-4 pe-20 block w-full border-gray-200 rounded-lg text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                              inputMode="numeric"
                            />
                            <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
                              <select
                                value={selectedUnit}
                                onChange={(e) => handleUnitChange(e.target.value)}
                                disabled={unitOptions.length <= 1}
                                className="block w-32 border-transparent bg-transparent text-gray-500 focus:ring-orange-500 focus:border-orange-500"
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
                          value={numericValue}
                          onChange={(e) => {
                            let processedValue = e.target.value.replace(/\D/g, '');
                            
                            if (processedValue && field.maxValue !== null && parseInt(processedValue) > field.maxValue) {
                              return;
                            }
                            if (processedValue && field.minValue !== null && parseInt(processedValue) < field.minValue && processedValue.length >= field.minValue.toString().length) {
                              return;
                            }
                            
                            handleInputChange(fieldName, processedValue);
                          }}
                          placeholder={field.placeholder || ''}
                          className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:ring-orange-500"
                          inputMode="numeric"
                        />
                      );

                    case 'select':
                      const selectOptions = field.options ? JSON.parse(field.options) : [];
                      
                      if (hasUnits && unitOptions.length > 0) {
                        return (
                          <div className="relative">
                            <select
                              className="py-2.5 px-4 pe-20 block w-full border-gray-200 rounded-lg text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                              value={displayValue}
                              onChange={(e) => handleValueWithUnit(e.target.value)}
                            >
                              <option value="">{field.placeholder || "Seçiniz"}</option>
                              {selectOptions.map((option: string, index: number) => (
                                <option key={index} value={option}>{option}</option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
                              <select
                                value={selectedUnit}
                                onChange={(e) => handleUnitChange(e.target.value)}
                                disabled={unitOptions.length <= 1}
                                className="block w-32 border-transparent bg-transparent text-gray-500 focus:ring-orange-500 focus:border-orange-500"
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
                        <select
                          value={displayValue}
                          onChange={(e) => handleInputChange(fieldName, e.target.value)}
                          className="py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:ring-orange-500"
                        >
                          <option value="">{field.placeholder || "Seçiniz"}</option>
                          {selectOptions.map((option: string, index: number) => (
                            <option key={index} value={option}>{option}</option>
                          ))}
                        </select>
                      );

                    case 'checkbox':
                      const checkboxOptions = field.options ? JSON.parse(field.options) : [];
                      const selectedValues = Array.isArray(currentValue) ? currentValue : [];
                      
                      return (
                        <div className="space-y-2">
                          {checkboxOptions.map((option: string, index: number) => (
                            <label key={index} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedValues.includes(option)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleInputChange(fieldName, [...selectedValues, option]);
                                  } else {
                                    handleInputChange(fieldName, selectedValues.filter((v: string) => v !== option));
                                  }
                                }}
                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      );

                    case 'boolean':
                      return (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={currentValue === true}
                            onChange={(e) => handleInputChange(fieldName, e.target.checked)}
                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{field.label}</span>
                        </label>
                      );

                    default:
                      return <p className="text-red-500">Desteklenmeyen field türü: {field.fieldType}</p>;
                  }
                })()}
                
                {field.description && (
                  <p className="text-sm text-gray-500">{field.description}</p>
                )}
                
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
          })}
        </div>

        <div className="mt-8">
          <button
            onClick={handleSubmit}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Sonraki Adım
          </button>
        </div>
      </div>
    </div>
  );
}