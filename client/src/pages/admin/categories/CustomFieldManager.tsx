import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Save, X, Type, List, CheckSquare, Hash } from "lucide-react";
import type { CategoryCustomField, InsertCustomField, CustomFieldType } from "@shared/schema";

interface CustomFieldManagerProps {
  categoryId: number;
  categoryName: string;
}

interface CustomFieldFormData {
  name: string;
  label: string;
  fieldType: CustomFieldType;
  isRequired: boolean;
  options: string[];
  placeholder?: string;
  sortOrder: number;
}

const fieldTypeOptions: { value: CustomFieldType; label: string; icon: React.ReactNode }[] = [
  { value: 'text', label: 'Metin', icon: <Type className="w-4 h-4" /> },
  { value: 'number', label: 'Sayı', icon: <Hash className="w-4 h-4" /> },
  { value: 'select', label: 'Seçim Listesi', icon: <List className="w-4 h-4" /> },
  { value: 'checkbox', label: 'Onay Kutusu', icon: <CheckSquare className="w-4 h-4" /> },
];

export default function CustomFieldManager({ categoryId, categoryName }: CustomFieldManagerProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState<CategoryCustomField | undefined>();
  const [formData, setFormData] = useState<CustomFieldFormData>({
    name: '',
    label: '',
    fieldType: 'text',
    isRequired: false,
    options: [],
    placeholder: '',
    sortOrder: 0,
  });

  // Fetch custom fields
  const { data: customFields = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/categories", categoryId, "custom-fields"],
    queryFn: async (): Promise<CategoryCustomField[]> => {
      const response = await fetch(`/api/admin/categories/${categoryId}/custom-fields`);
      if (!response.ok) throw new Error("Özel alanlar alınamadı");
      return response.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertCustomField) => {
      const response = await fetch(`/api/admin/categories/${categoryId}/custom-fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Özel alan oluşturulamadı");
      return response.json();
    },
    onSuccess: () => {
      refetch();
      handleCloseForm();
      alert("Özel alan başarıyla oluşturuldu");
    },
    onError: () => {
      alert("Özel alan oluşturulurken hata oluştu");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CategoryCustomField> }) => {
      const response = await fetch(`/api/admin/categories/custom-fields/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Özel alan güncellenemedi");
      return response.json();
    },
    onSuccess: () => {
      refetch();
      handleCloseForm();
      alert("Özel alan başarıyla güncellendi");
    },
    onError: () => {
      alert("Özel alan güncellenirken hata oluştu");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fieldId: number) => {
      const response = await fetch(`/api/admin/categories/custom-fields/${fieldId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Özel alan silinemedi");
      return response.json();
    },
    onSuccess: () => {
      refetch();
      alert("Özel alan başarıyla silindi");
    },
    onError: () => {
      alert("Özel alan silinirken hata oluştu");
    },
  });

  const handleOpenForm = (field?: CategoryCustomField) => {
    if (field) {
      setEditingField(field);
      setFormData({
        name: field.name,
        label: field.label,
        fieldType: field.fieldType,
        isRequired: field.isRequired,
        options: field.options || [],
        placeholder: field.placeholder || '',
        sortOrder: field.sortOrder,
      });
    } else {
      setEditingField(undefined);
      setFormData({
        name: '',
        label: '',
        fieldType: 'text',
        isRequired: false,
        options: [],
        placeholder: '',
        sortOrder: customFields.length,
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingField(undefined);
    setFormData({
      name: '',
      label: '',
      fieldType: 'text',
      isRequired: false,
      options: [],
      placeholder: '',
      sortOrder: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.label.trim()) {
      alert("Alan adı ve etiketi gereklidir");
      return;
    }

    const submitData = {
      categoryId,
      ...formData,
      options: formData.fieldType === 'select' ? formData.options : [],
    };

    if (editingField) {
      updateMutation.mutate({ id: editingField.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, '']
    });
  };

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const isLoading_mutation = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Özel alanlar yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {categoryName} - Özel Alanlar
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Bu kategoriye ait ilanlar için özel form alanları yönetin
          </p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="px-4 py-2 bg-[#EC7830] text-white rounded-lg hover:bg-[#d6691a] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Özel Alan Ekle
        </button>
      </div>

      {/* Custom Fields List */}
      {customFields.length > 0 ? (
        <div className="space-y-3">
          {customFields.map((field) => {
            const fieldTypeOption = fieldTypeOptions.find(opt => opt.value === field.fieldType);
            
            return (
              <div key={field.id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {fieldTypeOption?.icon}
                      <h4 className="font-medium text-gray-900">{field.label}</h4>
                      {field.isRequired && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                          Zorunlu
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Alan Adı:</span> {field.name}</p>
                      <p><span className="font-medium">Tür:</span> {fieldTypeOption?.label}</p>
                      {field.placeholder && (
                        <p><span className="font-medium">Yer Tutucu:</span> {field.placeholder}</p>
                      )}
                      {field.options && field.options.length > 0 && (
                        <div>
                          <span className="font-medium">Seçenekler:</span>
                          <ul className="list-disc list-inside ml-2">
                            {field.options.map((option, index) => (
                              <li key={index}>{option}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleOpenForm(field)}
                      className="p-2 text-gray-400 hover:text-[#EC7830] rounded-lg hover:bg-orange-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Bu özel alanı silmek istediğinizden emin misiniz?")) {
                          deleteMutation.mutate(field.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <Type className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Henüz özel alan yok</p>
          <p className="text-sm">Bu kategoriye özel form alanları ekleyebilirsiniz</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingField ? "Özel Alan Düzenle" : "Yeni Özel Alan"}
              </h3>
              <button
                onClick={handleCloseForm}
                className="p-1 hover:bg-gray-100 rounded"
                disabled={isLoading_mutation}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alan Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
                    required
                    disabled={isLoading_mutation}
                    placeholder="field_name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etiket *
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
                    required
                    disabled={isLoading_mutation}
                    placeholder="Alan Etiketi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alan Türü
                </label>
                <select
                  value={formData.fieldType}
                  onChange={(e) => setFormData({ ...formData, fieldType: e.target.value as CustomFieldType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
                  disabled={isLoading_mutation}
                >
                  {fieldTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.fieldType !== 'checkbox' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yer Tutucu Metin
                  </label>
                  <input
                    type="text"
                    value={formData.placeholder}
                    onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
                    disabled={isLoading_mutation}
                    placeholder="Kullanıcıya gösterilecek ipucu"
                  />
                </div>
              )}

              {formData.fieldType === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seçenekler
                  </label>
                  <div className="space-y-2">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleUpdateOption(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
                          placeholder={`Seçenek ${index + 1}`}
                          disabled={isLoading_mutation}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          disabled={isLoading_mutation}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-[#EC7830] hover:text-[#EC7830]"
                      disabled={isLoading_mutation}
                    >
                      <Plus className="w-4 h-4 inline-block mr-2" />
                      Seçenek Ekle
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isRequired}
                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                    className="mr-2"
                    disabled={isLoading_mutation}
                  />
                  <span className="text-sm text-gray-700">Zorunlu alan</span>
                </label>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sıra
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
                    min="0"
                    disabled={isLoading_mutation}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isLoading_mutation}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EC7830] text-white rounded-md hover:bg-[#d6691a] flex items-center gap-2"
                  disabled={isLoading_mutation}
                >
                  {isLoading_mutation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {editingField ? "Güncelleniyor..." : "Oluşturuluyor..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingField ? "Güncelle" : "Oluştur"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}