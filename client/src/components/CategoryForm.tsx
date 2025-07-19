import { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import type { Category, InsertCategory, UpdateCategory } from "@shared/schema";

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InsertCategory | UpdateCategory) => void;
  category?: Category;
  parentCategory?: Category;
  categories: Category[];
  isLoading?: boolean;
}

function generateSlug(name: string): string {
  // Turkish character mappings
  const turkishMap: Record<string, string> = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
  };
  
  return name
    .toLowerCase()
    // Convert Turkish characters first
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (match) => turkishMap[match] || match)
    // Remove special characters except letters, numbers, spaces and hyphens
    .replace(/[^\w\s-]/g, '')
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Replace multiple hyphens with single
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    .trim();
}

export default function CategoryForm({
  isOpen,
  onClose,
  onSubmit,
  category,
  parentCategory,
  categories,
  isLoading = false,
}: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: "",
    parentId: null as number | null,
    icon: "",
    sortOrder: 0,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      // Edit mode
      setFormData({
        name: category.name,
        description: category.description || "",
        slug: category.slug,
        parentId: category.parentId,
        icon: category.icon || "",
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      });
    } else if (parentCategory) {
      // Add child mode
      setFormData({
        name: "",
        description: "",
        slug: "",
        parentId: parentCategory.id,
        icon: "",
        sortOrder: 0,
        isActive: true,
      });
    } else {
      // Add root category mode
      setFormData({
        name: "",
        description: "",
        slug: "",
        parentId: null,
        icon: "",
        sortOrder: 0,
        isActive: true,
      });
    }
    setErrors({});
  }, [category, parentCategory, isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Kategori adı gereklidir";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Slug gereklidir";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug sadece küçük harf, rakam ve tire içerebilir";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  const modalTitle = category ? "Kategoriyi Düzenle" : 
                   parentCategory ? `"${parentCategory.name}" altına kategori ekle` : 
                   "Yeni Kategori Ekle";

  // Build flat category list for parent selection
  const flatCategories = (cats: Category[], level = 0): Array<Category & { level: number }> => {
    const result: Array<Category & { level: number }> = [];
    cats.forEach(cat => {
      result.push({ ...cat, level });
      if ((cat as any).children) {
        result.push(...flatCategories((cat as any).children, level + 1));
      }
    });
    return result;
  };

  const flatCategoryList = flatCategories(categories);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 lg:p-6 border-b">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900 pr-4">{modalTitle}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4">
          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori Adı *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
              placeholder="Kategori adı giriniz"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
              placeholder="url-slug"
            />
            {errors.slug && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.slug}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
              placeholder="Kategori açıklaması (opsiyonel)"
            />
          </div>

          {/* Parent Category */}
          {!parentCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Üst Kategori
              </label>
              <select
                value={formData.parentId || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  parentId: e.target.value ? parseInt(e.target.value) : null 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
              >
                <option value="">Ana Kategori</option>
                {flatCategoryList
                  .filter(cat => !category || cat.id !== category.id) // Exclude self when editing
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {"—".repeat(cat.level)} {cat.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

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
              placeholder="0"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-[#EC7830] focus:ring-[#EC7830] border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Aktif kategori
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#EC7830] rounded-lg hover:bg-[#d6691a] focus:outline-none focus:ring-2 focus:ring-[#EC7830] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {category ? "Güncelle" : "Kaydet"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}