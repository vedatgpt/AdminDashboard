import { useState, useEffect } from "react";
import { X, Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { useCategoryCustomFields, useCreateCustomField, useUpdateCustomField, useDeleteCustomField } from "@/hooks/useCustomFields";
import type { Category, CategoryCustomField, InsertCustomField } from "@shared/schema";

interface CustomFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
}

interface CustomFieldFormData {
  fieldName: string;
  fieldType: "text" | "number" | "select" | "checkbox" | "number_range" | "boolean";
  label: string;
  placeholder: string;
  isRequired: boolean;
  options: string;
  sortOrder: number;
  isActive: boolean;
  // Numeric field options
  isNumericOnly: boolean;
  useThousandSeparator: boolean;
  useMobileNumericKeyboard: boolean;
  // Unit system
  hasUnits: boolean;
  unitOptions: string;
  defaultUnit: string;
  // Min/Max values for number fields
  minValue: string;
  maxValue: string;
}

const FIELD_TYPES = [
  { value: "text", label: "Metin" },
  { value: "number", label: "Sayı" },
  { value: "select", label: "Seçenekli Liste" },
  { value: "checkbox", label: "Çoklu Seçim" },
  { value: "number_range", label: "Sayı Aralığı" },
  { value: "boolean", label: "Evet/Hayır" },
];

export default function CustomFieldsModal({ isOpen, onClose, category }: CustomFieldsModalProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingField, setEditingField] = useState<CategoryCustomField | null>(null);
  const [formData, setFormData] = useState<CustomFieldFormData>({
    fieldName: "",
    fieldType: "text",
    label: "",
    placeholder: "",
    isRequired: false,
    options: "",
    sortOrder: 0,
    isActive: true,
    isNumericOnly: false,
    useThousandSeparator: false,
    useMobileNumericKeyboard: false,
    hasUnits: false,
    unitOptions: "",
    defaultUnit: "",
    minValue: "",
    maxValue: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAlert, setShowAlert] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  const { data: customFields = [], isLoading } = useCategoryCustomFields(category.id);
  const createMutation = useCreateCustomField();
  const updateMutation = useUpdateCustomField();
  const deleteMutation = useDeleteCustomField();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsFormOpen(false);
      setEditingField(null);
      resetForm();
    }
  }, [isOpen]);

  // Reset form when editing changes
  useEffect(() => {
    if (editingField) {
      setFormData({
        fieldName: editingField.fieldName,
        fieldType: editingField.fieldType as any,
        label: editingField.label,
        placeholder: editingField.placeholder || "",
        isRequired: editingField.isRequired,
        options: editingField.options || "",
        sortOrder: editingField.sortOrder,
        isActive: editingField.isActive,
        isNumericOnly: (editingField as any).isNumericOnly || false,
        useThousandSeparator: (editingField as any).useThousandSeparator || false,
        useMobileNumericKeyboard: (editingField as any).useMobileNumericKeyboard || false,
        hasUnits: (editingField as any).hasUnits || false,
        unitOptions: (editingField as any).unitOptions || "",
        defaultUnit: (editingField as any).defaultUnit || "",
        minValue: (editingField as any).minValue?.toString() || "",
        maxValue: (editingField as any).maxValue?.toString() || "",
      });
    } else {
      resetForm();
    }
    setErrors({});
  }, [editingField, isFormOpen]);

  const resetForm = () => {
    setFormData({
      fieldName: "",
      fieldType: "text",
      label: "",
      placeholder: "",
      isRequired: false,
      options: "",
      sortOrder: customFields.length,
      isActive: true,
      isNumericOnly: false,
      useThousandSeparator: false,
      useMobileNumericKeyboard: false,
      hasUnits: false,
      unitOptions: "",
      defaultUnit: "",
      minValue: "",
      maxValue: "",
    });
  };

  const showAlertMessage = (type: 'success' | 'error' | 'info', message: string) => {
    setShowAlert({ type, message });
    setTimeout(() => setShowAlert(null), 3000);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fieldName.trim()) {
      newErrors.fieldName = "Alan adı gereklidir";
    }
    if (!formData.label.trim()) {
      newErrors.label = "Etiket gereklidir";
    }

    // Validate options for select and checkbox types
    if ((formData.fieldType === "select" || formData.fieldType === "checkbox") && !formData.options.trim()) {
      newErrors.options = "Bu alan türü için seçenekler gereklidir";
    }

    if (formData.options.trim()) {
      try {
        const parsed = JSON.parse(formData.options);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          newErrors.options = "Seçenekler boş olmayan bir dizi olmalıdır";
        }
      } catch (error) {
        newErrors.options = "Geçerli bir JSON dizisi giriniz (örn: [\"Seçenek 1\", \"Seçenek 2\"])";
      }
    }

    // Validate unit options if hasUnits is enabled
    if (formData.hasUnits) {
      if (!formData.unitOptions.trim()) {
        newErrors.unitOptions = "Birim seçenekleri gereklidir";
      } else {
        try {
          const parsed = JSON.parse(formData.unitOptions);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            newErrors.unitOptions = "Birim seçenekleri boş olmayan bir dizi olmalıdır";
          }
        } catch (error) {
          newErrors.unitOptions = "Geçerli bir JSON dizisi giriniz (örn: [\"km\", \"mil\"])";
        }
      }

      if (!formData.defaultUnit.trim()) {
        newErrors.defaultUnit = "Varsayılan birim seçiniz";
      }
    }

    // Validate min/max values for number fields
    if (formData.fieldType === "number") {
      if (formData.minValue.trim() && isNaN(parseInt(formData.minValue))) {
        newErrors.minValue = "Geçerli bir sayı giriniz";
      }
      if (formData.maxValue.trim() && isNaN(parseInt(formData.maxValue))) {
        newErrors.maxValue = "Geçerli bir sayı giriniz";
      }
      if (formData.minValue.trim() && formData.maxValue.trim()) {
        const min = parseInt(formData.minValue);
        const max = parseInt(formData.maxValue);
        if (min >= max) {
          newErrors.maxValue = "Maksimum değer minimum değerden büyük olmalıdır";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData: Omit<InsertCustomField, 'categoryId'> = {
      fieldName: formData.fieldName.trim(),
      fieldType: formData.fieldType,
      label: formData.label.trim(),
      placeholder: formData.placeholder.trim() || null,
      isRequired: formData.isRequired,
      options: formData.options.trim() || null,
      sortOrder: formData.sortOrder,
      isActive: formData.isActive,
      isNumericOnly: formData.isNumericOnly,
      useThousandSeparator: formData.useThousandSeparator,
      useMobileNumericKeyboard: formData.useMobileNumericKeyboard,
      hasUnits: formData.hasUnits,
      unitOptions: formData.unitOptions.trim() || null,
      defaultUnit: formData.defaultUnit.trim() || null,
      minValue: formData.minValue.trim() ? parseInt(formData.minValue) : null,
      maxValue: formData.maxValue.trim() ? parseInt(formData.maxValue) : null,
    };

    try {
      if (editingField) {
        await updateMutation.mutateAsync({ fieldId: editingField.id, data: submitData });
        showAlertMessage('success', 'Özel alan güncellendi');
      } else {
        await createMutation.mutateAsync(submitData);
        showAlertMessage('success', 'Özel alan oluşturuldu');
      }
      
      setIsFormOpen(false);
      setEditingField(null);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'string' ? error : 
                          'Bir hata oluştu';
      showAlertMessage('error', errorMessage);
    }
  };

  const handleEdit = (field: CategoryCustomField) => {
    setEditingField(field);
    setIsFormOpen(true);
  };

  const handleDelete = async (field: CategoryCustomField) => {
    if (!confirm(`"${field.label}" alanını silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(field.id);
      showAlertMessage('success', 'Özel alan silindi');
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'string' ? error : 
                          'Silme işlemi başarısız';
      showAlertMessage('error', errorMessage);
    }
  };

  const handleAddNew = () => {
    setEditingField(null);
    setIsFormOpen(true);
  };

  const needsOptions = formData.fieldType === "select" || formData.fieldType === "checkbox";
  const isAnyMutationLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {category.name} - Özel Alanlar
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Alert Messages */}
        {showAlert && (
          <div className={`mx-6 mt-4 p-4 rounded-md ${
            showAlert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            showAlert.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {showAlert.message}
            </div>
          </div>
        )}

        <div className="p-6">
          {!isFormOpen ? (
            <div>
              {/* Add New Button */}
              <div className="mb-6">
                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#EC7830] border border-transparent rounded-lg hover:bg-[#d6691a] focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Alan Ekle
                </button>
              </div>

              {/* Custom Fields List */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Özel alanlar yükleniyor...</div>
                </div>
              ) : customFields.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">Bu kategori için henüz özel alan tanımlanmamış.</div>
                  <button
                    onClick={handleAddNew}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#EC7830] bg-white border border-[#EC7830] rounded-lg hover:bg-orange-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    İlk Alanı Ekle
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {customFields.map((field) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">{field.label}</h4>
                            {field.isRequired && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                Zorunlu
                              </span>
                            )}
                            {!field.isActive && (
                              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                Pasif
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 space-y-1">
                            <div><strong>Alan Adı:</strong> {field.fieldName}</div>
                            <div><strong>Tür:</strong> {FIELD_TYPES.find(t => t.value === field.fieldType)?.label}</div>
                            {field.placeholder && (
                              <div><strong>Placeholder:</strong> {field.placeholder}</div>
                            )}
                            {field.options && (
                              <div><strong>Seçenekler:</strong> {field.options}</div>
                            )}
                            {(field as any).hasUnits && (
                              <div>
                                <strong>Birimler:</strong> {(field as any).unitOptions} 
                                <span className="text-gray-400 ml-1">(varsayılan: {(field as any).defaultUnit})</span>
                              </div>
                            )}
                            {field.fieldType === "number" && ((field as any).minValue !== null || (field as any).maxValue !== null) && (
                              <div>
                                <strong>Değer Sınırı:</strong> 
                                {(field as any).minValue !== null && <span> Min: {(field as any).minValue}</span>}
                                {(field as any).maxValue !== null && <span> Max: {(field as any).maxValue}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(field)}
                            className="p-2 text-gray-400 hover:text-[#EC7830]"
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(field)}
                            className="p-2 text-gray-400 hover:text-red-600"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Form Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingField ? 'Özel Alan Düzenle' : 'Yeni Özel Alan'}
                </h3>
                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingField(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Field Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alan Adı *
                    </label>
                    <input
                      type="text"
                      value={formData.fieldName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fieldName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                      placeholder="marka, model, yakit_turu"
                    />
                    {errors.fieldName && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.fieldName}
                      </p>
                    )}
                  </div>

                  {/* Field Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alan Türü *
                    </label>
                    <select
                      value={formData.fieldType}
                      onChange={(e) => setFormData(prev => ({ ...prev, fieldType: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                    >
                      {FIELD_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Label */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Etiket *
                    </label>
                    <input
                      type="text"
                      value={formData.label}
                      onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                      placeholder="Marka, Model, Yakıt Türü"
                    />
                    {errors.label && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.label}
                      </p>
                    )}
                  </div>

                  {/* Placeholder */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placeholder
                    </label>
                    <input
                      type="text"
                      value={formData.placeholder}
                      onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                      placeholder="Marka seçiniz..."
                    />
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sıralama
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>

                {/* Options */}
                {needsOptions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seçenekler * (JSON format)
                    </label>
                    <textarea
                      value={formData.options}
                      onChange={(e) => setFormData(prev => ({ ...prev, options: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                      rows={4}
                      placeholder='["Benzin", "Dizel", "Elektrik", "Hybrid"]'
                    />
                    {errors.options && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.options}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      JSON dizisi formatında seçenekleri giriniz. Örnek: ["Seçenek 1", "Seçenek 2"]
                    </p>
                  </div>
                )}

                {/* Checkboxes */}
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isRequired"
                        checked={formData.isRequired}
                        onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                        className="h-4 w-4 text-[#EC7830] focus:ring-[#EC7830] border-gray-300 rounded"
                      />
                      <label htmlFor="isRequired" className="ml-2 text-sm text-gray-700">
                        Zorunlu alan
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="h-4 w-4 text-[#EC7830] focus:ring-[#EC7830] border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                        Aktif
                      </label>
                    </div>
                  </div>

                  {/* Numeric Field Options - Only for number field type */}
                  {formData.fieldType === "number" && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Sayı Alanı Özellikleri</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Binlik Ayraç
                          </label>
                          <select
                            value={formData.useThousandSeparator ? "yes" : "no"}
                            onChange={(e) => setFormData(prev => ({ ...prev, useThousandSeparator: e.target.value === "yes" }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                          >
                            <option value="no">Kullanma</option>
                            <option value="yes">Kullan (150.000)</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            150000 → 150.000 formatında görünüm
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mobil Klavye
                          </label>
                          <select
                            value={formData.useMobileNumericKeyboard ? "numeric" : "default"}
                            onChange={(e) => setFormData(prev => ({ ...prev, useMobileNumericKeyboard: e.target.value === "numeric" }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                          >
                            <option value="default">Varsayılan</option>
                            <option value="numeric">Sayı Klavyesi</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Mobil cihazlarda sayı klavyesi açılır
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Giriş Kontrolü
                          </label>
                          <select
                            value={formData.isNumericOnly ? "numbers-only" : "mixed"}
                            onChange={(e) => setFormData(prev => ({ ...prev, isNumericOnly: e.target.value === "numbers-only" }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                          >
                            <option value="mixed">Karışık</option>
                            <option value="numbers-only">Sadece Rakam</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Harf ve özel karakter engellenir
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Unit System - Available for all field types */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Birim Sistemi</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Birim Kullanımı
                        </label>
                        <select
                          value={formData.hasUnits ? "yes" : "no"}
                          onChange={(e) => setFormData(prev => ({ ...prev, hasUnits: e.target.value === "yes" }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                        >
                          <option value="no">Birim kullanma</option>
                          <option value="yes">Birim kullan</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Kullanıcının değer ile birlikte birim de seçebilmesini sağlar (örn: 52.000 km)
                        </p>
                      </div>

                      {formData.hasUnits && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Birim Seçenekleri *
                            </label>
                            <textarea
                              value={formData.unitOptions}
                              onChange={(e) => setFormData(prev => ({ ...prev, unitOptions: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                              rows={3}
                              placeholder='["km", "mil", "metre"]'
                            />
                            {errors.unitOptions && (
                              <p className="text-red-500 text-sm mt-1 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors.unitOptions}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              JSON dizisi formatında birimleri giriniz. Örnek: ["km", "mil", "metre"]
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Varsayılan Birim *
                            </label>
                            <input
                              type="text"
                              value={formData.defaultUnit}
                              onChange={(e) => setFormData(prev => ({ ...prev, defaultUnit: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                              placeholder="km"
                            />
                            {errors.defaultUnit && (
                              <p className="text-red-500 text-sm mt-1 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors.defaultUnit}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Kullanıcı için önceden seçili olan birim
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Min/Max values for number fields */}
                  {formData.fieldType === "number" && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Değer Sınırları</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Değer
                          </label>
                          <input
                            type="number"
                            value={formData.minValue}
                            onChange={(e) => setFormData(prev => ({ ...prev, minValue: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                            placeholder="0"
                          />
                          {errors.minValue && (
                            <p className="text-red-500 text-sm mt-1 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors.minValue}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maksimum Değer
                          </label>
                          <input
                            type="number"
                            value={formData.maxValue}
                            onChange={(e) => setFormData(prev => ({ ...prev, maxValue: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                            placeholder="9999"
                          />
                          {errors.maxValue && (
                            <p className="text-red-500 text-sm mt-1 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors.maxValue}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Kullanıcının girebileceği minimum ve maksimum değerleri belirler (isteğe bağlı)
                      </p>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingField(null);
                    }}
                    className="py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isAnyMutationLoading}
                    className="py-2 px-4 text-sm font-medium text-white bg-[#EC7830] border border-transparent rounded-lg hover:bg-[#d6691a] focus:outline-none focus:ring-2 focus:ring-[#EC7830] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnyMutationLoading ? 'Kaydediliyor...' : (editingField ? 'Güncelle' : 'Oluştur')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}