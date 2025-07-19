import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Filter, SortAsc, Plus, Edit2, Trash2, Save, X } from "lucide-react";

interface FilterManagerProps {
  categoryId: number;
  categoryName: string;
}

interface FilterData {
  id: number;
  label: string;
  name: string;
  dataType: string;
  isRequired: boolean;
  options?: string[];
}

interface SortOption {
  id: number;
  label: string;
  name: string;
  dataType: string;
  direction: 'asc' | 'desc';
}

const dataTypeOptions = [
  { value: 'string', label: 'Metin' },
  { value: 'number', label: 'Sayı' },
  { value: 'select', label: 'Seçim Listesi' },
  { value: 'date', label: 'Tarih' },
  { value: 'boolean', label: 'Evet/Hayır' },
  { value: 'price', label: 'Fiyat' }
];

export default function FilterManager({ categoryId, categoryName }: FilterManagerProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<'filter' | 'sort'>('filter');
  const [editingFilter, setEditingFilter] = useState<FilterData | SortOption | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    name: '',
    dataType: 'string',
    isRequired: false,
    options: [] as string[],
    direction: 'asc' as 'asc' | 'desc'
  });
  const [optionInput, setOptionInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/categories", categoryId, "filters"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/categories/${categoryId}/filters`);
      if (!response.ok) throw new Error("Filtreler alınamadı");
      return response.json();
    }
  });

  const filters = data?.filters || [];
  const sortOptions = data?.sortOptions || [];

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = filterType === 'filter' 
        ? `/api/admin/categories/${categoryId}/filters`
        : `/api/admin/categories/${categoryId}/sort-options`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Oluşturulamadı");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories", categoryId, "filters"] });
      handleCloseForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = filterType === 'filter' 
        ? `/api/admin/categories/${categoryId}/filters/${data.id}`
        : `/api/admin/categories/${categoryId}/sort-options/${data.id}`;
      
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Güncellenemedi");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories", categoryId, "filters"] });
      handleCloseForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const endpoint = filterType === 'filter' 
        ? `/api/admin/categories/${categoryId}/filters/${id}`
        : `/api/admin/categories/${categoryId}/sort-options/${id}`;
      
      const response = await fetch(endpoint, { method: "DELETE" });
      if (!response.ok) throw new Error("Silinemedi");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories", categoryId, "filters"] });
    }
  });

  const handleOpenForm = (type: 'filter' | 'sort', item?: FilterData | SortOption) => {
    setFilterType(type);
    if (item) {
      setEditingFilter(item);
      setFormData({
        label: item.label,
        name: item.name,
        dataType: item.dataType,
        isRequired: 'isRequired' in item ? item.isRequired : false,
        options: 'options' in item ? item.options || [] : [],
        direction: 'direction' in item ? item.direction : 'asc'
      });
    } else {
      setEditingFilter(null);
      setFormData({
        label: '',
        name: '',
        dataType: 'string',
        isRequired: false,
        options: [],
        direction: 'asc'
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingFilter(null);
    setFormData({
      label: '',
      name: '',
      dataType: 'string',
      isRequired: false,
      options: [],
      direction: 'asc'
    });
    setOptionInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      ...(editingFilter && { id: editingFilter.id })
    };

    if (editingFilter) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleAddOption = () => {
    if (optionInput.trim() && !formData.options.includes(optionInput.trim())) {
      const newOptions = [...formData.options, optionInput.trim()];
      setFormData({ ...formData, options: newOptions });
      setOptionInput('');
    }
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
    <div>
      {/* Filters Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
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
            {filters.map((filter: FilterData) => {
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
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
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
            {sortOptions.map((sortOption: SortOption) => {
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
                        <p><span className="font-medium">Yön:</span> {sortOption.direction === 'asc' ? 'Artan' : 'Azalan'}</p>
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
              <h3 className="text-lg font-semibold">
                {filterType === 'filter' 
                  ? (editingFilter ? "Filtre Düzenle" : "Yeni Filtre")
                  : (editingFilter ? "Sıralama Düzenle" : "Yeni Sıralama")
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
                    {filterType === 'filter' ? 'Filtre Adı' : 'Sıralama Adı'} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
                    required
                    disabled={isLoading_mutation}
                    placeholder={filterType === 'filter' ? 'filter_name' : 'sort_field'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Görünen İsim *
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
                    required
                    disabled={isLoading_mutation}
                    placeholder="Kullanıcıların göreceği isim"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Veri Türü *
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

                {filterType === 'filter' && (
                  <div className="flex items-center pt-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isRequired}
                        onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                        className="mr-2 accent-[#EC7830]"
                        disabled={isLoading_mutation}
                      />
                      <span className="text-sm text-gray-700">Zorunlu Filtre</span>
                    </label>
                  </div>
                )}

                {filterType === 'sort' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sıralama Yönü
                    </label>
                    <select
                      value={formData.direction}
                      onChange={(e) => setFormData({ ...formData, direction: e.target.value as 'asc' | 'desc' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={isLoading_mutation}
                    >
                      <option value="asc">Artan (A-Z, 0-9)</option>
                      <option value="desc">Azalan (Z-A, 9-0)</option>
                    </select>
                  </div>
                )}
              </div>

              {formData.dataType === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seçim Seçenekleri
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
                      placeholder="Seçenek ekle..."
                      disabled={isLoading_mutation}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      disabled={isLoading_mutation}
                    >
                      Ekle
                    </button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <span className="text-sm">{option}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={isLoading_mutation}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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