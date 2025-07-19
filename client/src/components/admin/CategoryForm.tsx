import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Category, InsertCategory } from "@shared/schema";

interface CategoryFormProps {
  category?: Category | null;
  onSubmit: (data: InsertCategory | Partial<InsertCategory>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function CategoryForm({ category, onSubmit, onCancel, isLoading }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sortOrder: 0,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      });
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Kategori adı gereklidir";
    }
    if (formData.name.length < 2) {
      newErrors.name = "Kategori adı en az 2 karakter olmalıdır";
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onCancel}></div>
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  {category ? 'Kategori Düzenle' : 'Yeni Kategori'}
                </h3>
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Category Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori Adı *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border-gray-300 px-3 py-2 text-sm focus:border-[#EC7830] focus:ring-[#EC7830] ${
                      errors.name ? 'border-red-500' : ''
                    }`}
                    placeholder="Kategori adını giriniz"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="block w-full rounded-lg border-gray-300 px-3 py-2 text-sm focus:border-[#EC7830] focus:ring-[#EC7830]"
                    placeholder="Kategori açıklaması (isteğe bağlı)"
                  />
                </div>

                {/* Sort Order */}
                <div>
                  <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
                    Sıralama
                  </label>
                  <input
                    type="number"
                    id="sortOrder"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleChange}
                    min="0"
                    className="block w-full rounded-lg border-gray-300 px-3 py-2 text-sm focus:border-[#EC7830] focus:ring-[#EC7830]"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#EC7830] focus:ring-[#EC7830] border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Aktif
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full justify-center rounded-lg bg-[#EC7830] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#d96a2a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC7830] sm:ml-3 sm:w-auto disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin inline-block size-4 border-[2px] border-current border-t-transparent text-white rounded-full mr-2" role="status" aria-label="loading">
                      <span className="sr-only">Loading...</span>
                    </div>
                    {category ? 'Güncelleniyor...' : 'Ekleniyor...'}
                  </>
                ) : (
                  category ? 'Güncelle' : 'Ekle'
                )}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:pointer-events-none"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}