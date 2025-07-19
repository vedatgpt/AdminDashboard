import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Save, X, Filter, SortAsc } from "lucide-react";
import type { CategoryFilter, InsertFilter } from "@shared/schema";

interface FilterManagerProps {
  categoryId: number;
  categoryName: string;
}

interface FilterFormData {
  name: string;
  label: string;
  filterType: 'filter' | 'sort';
  dataType: string;
  options: string[];
  isRequired: boolean;
  sortOrder: number;
}

const dataTypeOptions = [
  { value: 'text', label: 'Metin' },
  { value: 'number', label: 'Sayı' },
  { value: 'date', label: 'Tarih' },
  { value: 'boolean', label: 'Evet/Hayır' },
  { value: 'range', label: 'Aralık' },
];

export default function FilterManager({ categoryId, categoryName }: FilterManagerProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<'filter' | 'sort'>('filter');
  const [editingFilter, setEditingFilter] = useState<CategoryFilter | undefined>();
  const [formData, setFormData] = useState<FilterFormData>({
    name: '',
    label: '',
    filterType: 'filter',
    dataType: 'text',
    options: [],
    isRequired: false,
    sortOrder: 0,
  });

  // Fetch filters
  const { data: allFilters = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/categories", categoryId, "filters"],
    queryFn: async (): Promise<CategoryFilter[]> => {
      const response = await fetch(`/api/admin/categories/${categoryId}/filters`);
      if (!response.ok) throw new Error("Filtreler alınamadı");
      return response.json();
    },
  });

  const filters = allFilters.filter(f => f.filterType === 'filter');
  const sortOptions = allFilters.filter(f => f.filterType === 'sort');

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertFilter) => {
      const response = await fetch(`/api/admin/categories/${categoryId}/filters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Filtre oluşturulamadı");
      return response.json();
    },
    onSuccess: () => {
      refetch();
      handleCloseForm();
      alert("Filtre başarıyla oluşturuldu");
    },
    onError: () => {
      alert("Filtre oluşturulurken hata oluştu");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CategoryFilter> }) => {
      const response = await fetch(`/api/admin/categories/filters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Filtre güncellenemedi");
      return response.json();
    },
    onSuccess: () => {
      refetch();
      handleCloseForm();
      alert("Filtre başarıyla güncellendi");
    },
    onError: () => {
      alert("Filtre güncellenirken hata oluştu");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (filterId: number) => {
      const response = await fetch(`/api/admin/categories/filters/${filterId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Filtre silinemedi");
      return response.json();
    },
    onSuccess: () => {
      refetch();
      alert("Filtre başarıyla silindi");
    },
    onError: () => {
      alert("Filtre silinirken hata oluştu");
    },
  });

  const handleOpenForm = (type: 'filter' | 'sort', filter?: CategoryFilter) => {
    setFilterType(type);
    
    if (filter) {
      setEditingFilter(filter);
      setFormData({
        name: filter.name,
        label: filter.label,
        filterType: filter.filterType,
        dataType: filter.dataType,
        options: filter.options || [],
        isRequired: filter.isRequired,
        sortOrder: filter.sortOrder,
      });
    } else {
      setEditingFilter(undefined);
      setFormData({
        name: '',
        label: '',
        filterType: type,
        dataType: 'text',
        options: [],
        isRequired: false,
        sortOrder: type === 'filter' ? filters.length : sortOptions.length,
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingFilter(undefined);
    setFormData({
      name: '',
      label: '',
      filterType: 'filter',
      dataType: 'text',
      options: [],
      isRequired: false,
      sortOrder: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.label.trim()) {
      alert("Filtre adı ve etiketi gereklidir");
      return;
    }

    const submitData = {
      categoryId,
      ...formData,
    };

    if (editingFilter) {
      updateMutation.mutate({ id: editingFilter.id, data: submitData });
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
        <div className="text-center text-gray-500">Filtreler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#EC7830]" />
              Arama Filtreleri ({filters.length})
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {categoryName} kategorisi için arama filtreleri
            </p>
          </div>
          <button
            onClick={() => handleOpenForm('filter')}
            className="px-4 py-2 bg-[#EC7830] text-white rounded-lg hover:bg-[#d6691a] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Filtre Ekle
          </button>
        </div>

        {filters.length > 0 ? (
          <div className="space-y-3">
            {filters.map((filter) => {
              const dataTypeOption = dataTypeOptions.find(opt => opt.value === filter.dataType);
              
              return (
                <div key={filter.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Filter className="w-4 h-4 text-[#EC7830]" />
                        <h4 className="font-medium text-gray-900">{filter.label}</h4>
                        {filter.isRequired && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                            Zorunlu
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Filtre Adı:</span> {filter.name}</p>
                        <p><span className="font-medium">Veri Türü:</span> {dataTypeOption?.label}</p>
                        {filter.options && filter.options.length > 0 && (
                          <div>
                            <span className="font-medium">Seçenekler:</span>
                            <ul className="list-disc list-inside ml-2">
                              {filter.options.map((option, index) => (
                                <li key={index}>{option}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleOpenForm('filter', filter)}
                        className="p-2 text-gray-400 hover:text-[#EC7830] rounded-lg hover:bg-orange-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Bu filtreyi silmek istediğinizden emin misiniz?")) {
                            deleteMutation.mutate(filter.id);
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
          <div className="text-center text-gray-500 py-6">
            <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Henüz filtre yok</p>
            <p className="text-sm">Bu kategoriye arama filtreleri ekleyebilirsiniz</p>
          </div>
        )}
      </div>

      {/* Sort Options Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <SortAsc className="w-5 h-5 text-[#EC7830]" />
              Sıralama Seçenekleri ({sortOptions.length})
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {categoryName} kategorisi için sıralama seçenekleri
            </p>
          </div>
          <button
            onClick={() => handleOpenForm('sort')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Sıralama Ekle
          </button>
        </div>

        {sortOptions.length > 0 ? (
          <div className="space-y-3">
            {sortOptions.map((sortOption) => {
              const dataTypeOption = dataTypeOptions.find(opt => opt.value === sortOption.dataType);
              
              return (
                <div key={sortOption.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <SortAsc className="w-4 h-4 text-green-600" />
                        <h4 className="font-medium text-gray-900">{sortOption.label}</h4>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Sıralama Adı:</span> {sortOption.name}</p>
                        <p><span className="font-medium">Veri Türü:</span> {dataTypeOption?.label}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleOpenForm('sort', sortOption)}
                        className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Bu sıralama seçeneğini silmek istediğinizden emin misiniz?")) {
                            deleteMutation.mutate(sortOption.id);
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
          <div className="text-center text-gray-500 py-6">
            <SortAsc className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Henüz sıralama seçeneği yok</p>
            <p className="text-sm">Bu kategoriye sıralama seçenekleri ekleyebilirsiniz</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {filterType === 'filter' ? (
                  <Filter className="w-5 h-5 text-[#EC7830]" />
                ) : (
                  <SortAsc className="w-5 h-5 text-green-600" />
                )}
                {editingFilter 
                  ? `${filterType === 'filter' ? 'Filtre' : 'Sıralama'} Düzenle`
                  : `Yeni ${filterType === 'filter' ? 'Filtre' : 'Sıralama'}`
                }
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
                    {filterType === 'filter' ? 'Filtre' : 'Sıralama'} Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
                    required
                    disabled={isLoading_mutation}
                    placeholder="filter_name"
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
                    placeholder="Filtre Etiketi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Veri Türü
                </label>
                <select
                  value={formData.dataType}
                  onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
                  disabled={isLoading_mutation}
                >
                  {dataTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {(formData.dataType === 'text' && filterType === 'filter') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filtre Seçenekleri
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
                {filterType === 'filter' && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isRequired}
                      onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                      className="mr-2"
                      disabled={isLoading_mutation}
                    />
                    <span className="text-sm text-gray-700">Zorunlu filtre</span>
                  </label>
                )}

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
                  className={`px-4 py-2 text-white rounded-md hover:opacity-90 flex items-center gap-2 ${
                    filterType === 'filter' ? 'bg-[#EC7830]' : 'bg-green-600'
                  }`}
                  disabled={isLoading_mutation}
                >
                  {isLoading_mutation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {editingFilter ? "Güncelleniyor..." : "Oluşturuluyor..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingFilter ? "Güncelle" : "Oluştur"}
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