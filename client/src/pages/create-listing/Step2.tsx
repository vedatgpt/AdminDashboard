import { useListing } from '../../contexts/ListingContext';
import { useCustomFields } from '../../hooks/useCustomFields';

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
    updateFormData({ [fieldName]: value });
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
            const currentValue = formData.customFields[field.fieldName] || '';
            
            return (
              <div key={field.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.fieldType === 'text' && (
                  <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                    placeholder={field.placeholder || ''}
                    className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:ring-orange-500"
                  />
                )}

                {field.fieldType === 'number' && (
                  <input
                    type="number"
                    value={currentValue}
                    onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                    placeholder={field.placeholder || ''}
                    min={field.minValue || undefined}
                    max={field.maxValue || undefined}
                    className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:ring-orange-500"
                  />
                )}

                {field.fieldType === 'select' && (
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