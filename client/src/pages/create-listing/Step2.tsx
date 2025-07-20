import { useListing } from '../../contexts/ListingContext';
import { useCustomFields } from '../../hooks/useCustomFields';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../styles/quill-custom.css';

export default function Step2() {
  const { state, dispatch } = useListing();
  const { selectedCategory, formData } = state;
  
  const updateFormData = (newData: any) => {
    dispatch({ type: 'SET_CUSTOM_FIELDS', payload: { ...formData.customFields, ...newData } });
  };
  
  const nextStep = () => {
    dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
  };
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

  // Custom fields yoksa da fiyat inputu gösterilmeli

  const handleInputChange = (fieldName: string, value: any) => {
    updateFormData({ [fieldName]: value });
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Açıklama Input - Tüm kategoriler için geçerli */}
        <div className="space-y-2 mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Açıklama
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="quill-editor-wrapper">
            <ReactQuill
              theme="snow"
              value={formData.customFields.description || ''}
              onChange={(value) => handleInputChange('description', value)}
              placeholder="Ürününüzün detaylı açıklamasını yazınız..."
              onFocus={() => {
                // Placeholder'ı temizle
                if (!formData.customFields.description || formData.customFields.description === '') {
                  handleInputChange('description', '');
                }
              }}
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  [{ 'color': [] }, { 'background': [] }],
                  ['link'],
                  ['clean']
                ],
              }}
            />
          </div>
        </div>

        {/* Fiyat Input - Tüm kategoriler için geçerli */}
        <div className="space-y-2 mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Fiyat
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
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

        {customFields && customFields.length > 0 && (
          <div className="space-y-6">
            {customFields.map((field) => {
            const currentValue = formData.customFields[field.fieldName] || '';
            
            return (
              <div key={field.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.fieldType === 'text' && (
                  field.hasUnits && field.unitOptions ? (
                    (() => {
                      const unitOptions = JSON.parse(field.unitOptions || '[]');
                      const selectedUnit = typeof currentValue === 'object' 
                        ? currentValue.unit || field.defaultUnit || unitOptions[0]
                        : field.defaultUnit || unitOptions[0];
                      
                      if (unitOptions.length <= 1) {
                        return (
                          <div className="relative">
                            <input
                              type="text"
                              value={typeof currentValue === 'object' ? currentValue.value || '' : currentValue}
                              onChange={(e) => {
                                handleInputChange(field.fieldName, { value: e.target.value, unit: selectedUnit });
                              }}
                              placeholder={field.placeholder || ''}
                              className="py-2.5 sm:py-3 px-4 pe-16 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-orange-500 focus:ring-orange-500"
                            />
                            <div className="absolute inset-y-0 end-0 flex items-center pointer-events-none z-20 pe-4">
                              <span className="text-gray-500">{selectedUnit}</span>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="relative">
                          <input
                            type="text"
                            value={typeof currentValue === 'object' ? currentValue.value || '' : currentValue}
                            onChange={(e) => {
                              handleInputChange(field.fieldName, { value: e.target.value, unit: selectedUnit });
                            }}
                            placeholder={field.placeholder || ''}
                            className="py-2.5 sm:py-3 px-4 pe-20 block w-full border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                          />
                          <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
                            <select
                              value={selectedUnit}
                              onChange={(e) => {
                                const value = typeof currentValue === 'object' ? currentValue.value || '' : currentValue || '';
                                handleInputChange(field.fieldName, { value, unit: e.target.value });
                              }}
                              className="block w-full border-transparent rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            >
                              {unitOptions.map((unit: string, index: number) => (
                                <option key={index} value={unit}>{unit}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <input
                      type="text"
                      value={currentValue}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                      placeholder={field.placeholder || ''}
                      className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:ring-orange-500"
                    />
                  )
                )}

                {field.fieldType === 'number' && (
                  field.hasUnits && field.unitOptions ? (
                    (() => {
                      const unitOptions = JSON.parse(field.unitOptions || '[]');
                      const selectedUnit = typeof currentValue === 'object' 
                        ? currentValue.unit || field.defaultUnit || unitOptions[0]
                        : field.defaultUnit || unitOptions[0];
                      
                      if (unitOptions.length <= 1) {
                        return (
                          <div className="relative">
                            <input
                              type="text"
                              value={(() => {
                                const value = typeof currentValue === 'object' ? currentValue.value || '' : currentValue || '';
                                return field.useThousandSeparator ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : value;
                              })()}
                              onChange={(e) => {
                                let processedValue = e.target.value.replace(/\D/g, '');
                                
                                if (processedValue && field.maxValue !== null && parseInt(processedValue) > field.maxValue) {
                                  return;
                                }
                                if (processedValue && field.minValue !== null && parseInt(processedValue) < field.minValue && processedValue.length >= field.minValue.toString().length) {
                                  return;
                                }
                                
                                handleInputChange(field.fieldName, { value: processedValue, unit: selectedUnit });
                              }}
                              placeholder={field.placeholder || ''}
                              inputMode={field.useMobileNumericKeyboard ? "numeric" : undefined}
                              className="py-2.5 sm:py-3 px-4 pe-16 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-orange-500 focus:ring-orange-500"
                            />
                            <div className="absolute inset-y-0 end-0 flex items-center pointer-events-none z-20 pe-4">
                              <span className="text-gray-500">{selectedUnit}</span>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="relative">
                          <input
                            type="text"
                            value={(() => {
                              const value = typeof currentValue === 'object' ? currentValue.value || '' : currentValue || '';
                              return field.useThousandSeparator ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : value;
                            })()}
                            onChange={(e) => {
                              let processedValue = e.target.value.replace(/\D/g, '');
                              
                              if (processedValue && field.maxValue !== null && parseInt(processedValue) > field.maxValue) {
                                return;
                              }
                              if (processedValue && field.minValue !== null && parseInt(processedValue) < field.minValue && processedValue.length >= field.minValue.toString().length) {
                                return;
                              }
                              
                              handleInputChange(field.fieldName, { value: processedValue, unit: selectedUnit });
                            }}
                            placeholder={field.placeholder || ''}
                            inputMode={field.useMobileNumericKeyboard ? "numeric" : undefined}
                            className="py-2.5 sm:py-3 px-4 pe-20 block w-full border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                          />
                          <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
                            <select
                              value={selectedUnit}
                              onChange={(e) => {
                                const value = typeof currentValue === 'object' ? currentValue.value || '' : currentValue || '';
                                handleInputChange(field.fieldName, { value, unit: e.target.value });
                              }}
                              className="block w-full border-transparent rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            >
                              {unitOptions.map((unit: string, index: number) => (
                                <option key={index} value={unit}>{unit}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <input
                      type="text"
                      value={(() => {
                        const value = currentValue || '';
                        return field.useThousandSeparator ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : value;
                      })()}
                      onChange={(e) => {
                        let processedValue = e.target.value.replace(/\D/g, '');
                        
                        if (processedValue && field.maxValue !== null && parseInt(processedValue) > field.maxValue) {
                          return;
                        }
                        if (processedValue && field.minValue !== null && parseInt(processedValue) < field.minValue && processedValue.length >= field.minValue.toString().length) {
                          return;
                        }
                        
                        handleInputChange(field.fieldName, processedValue);
                      }}
                      placeholder={field.placeholder || ''}
                      inputMode={field.useMobileNumericKeyboard ? "numeric" : undefined}
                      min={field.minValue || undefined}
                      max={field.maxValue || undefined}
                      className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:ring-orange-500"
                    />
                  )
                )}

                {field.fieldType === 'select' && (
                  field.hasUnits && field.unitOptions ? (
                    <div className="relative">
                      <select
                        value={typeof currentValue === 'object' ? currentValue.value || '' : currentValue}
                        onChange={(e) => {
                          const unitOptions = JSON.parse(field.unitOptions || '[]');
                          const selectedUnit = typeof currentValue === 'object' 
                            ? currentValue.unit || field.defaultUnit || unitOptions[0]
                            : field.defaultUnit || unitOptions[0];
                          handleInputChange(field.fieldName, { value: e.target.value, unit: selectedUnit });
                        }}
                        className="py-2.5 sm:py-3 px-4 pe-20 block w-full border-gray-200 rounded-lg sm:text-sm focus:z-10 focus:border-orange-500 focus:ring-orange-500"
                      >
                        <option value="">{field.placeholder || "Seçiniz"}</option>
                        {field.options && JSON.parse(field.options).map((option: string, index: number) => (
                          <option key={index} value={option}>{option}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 end-0 flex items-center text-gray-500 pe-px">
                        <select
                          value={typeof currentValue === 'object' ? currentValue.unit || field.defaultUnit : field.defaultUnit}
                          onChange={(e) => {
                            const value = typeof currentValue === 'object' ? currentValue.value || '' : currentValue || '';
                            handleInputChange(field.fieldName, { value, unit: e.target.value });
                          }}
                          className="block w-full border-transparent rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        >
                          {JSON.parse(field.unitOptions || '[]').map((unit: string, index: number) => (
                            <option key={index} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={currentValue}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                      className="py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:ring-orange-500"
                    >
                      <option value="">{field.placeholder || "Seçiniz"}</option>
                      {field.options && JSON.parse(field.options).map((option: string, index: number) => (
                        <option key={index} value={option}>{option}</option>
                      ))}
                    </select>
                  )
                )}

                {field.fieldType === 'checkbox' && field.options && (
                  <div className="space-y-2">
                    {JSON.parse(field.options).map((option: string, index: number) => {
                      const selectedValues = Array.isArray(currentValue) ? currentValue : [];
                      return (
                        <label key={index} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedValues.includes(option)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleInputChange(field.fieldName, [...selectedValues, option]);
                              } else {
                                handleInputChange(field.fieldName, selectedValues.filter((v: string) => v !== option));
                              }
                            }}
                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

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

        <div className="mt-8">
          <button
            onClick={nextStep}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Sonraki Adım
          </button>
        </div>
      </div>
    </div>
  );
}