import { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import type { Category, InsertCategory, UpdateCategory } from "@shared/schema";

// Helper function to update category metadata
const updateCategoryMetadata = async (categoryId: number, labelKey: string) => {
  try {
    const response = await fetch(`/api/categories/${categoryId}/metadata`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labelKey }),
    });
    
    if (!response.ok) {
      console.error('Failed to update category metadata');
    }
  } catch (error) {
    console.error('Error updating category metadata:', error);
  }
};

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InsertCategory | UpdateCategory, labelKey?: string) => void;
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
    slug: "",
    parentId: null as number | null,
    icon: null as string | null,
    sortOrder: 0,
    isActive: true,
    labelKey: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [iconFile, setIconFile] = useState<File | null>(null);

  useEffect(() => {
    if (category) {
      // Edit mode - load existing metadata
      setFormData({
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        icon: category.icon || null,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        labelKey: "",
      });
      
      // Load existing metadata for this category with cache optimization
      const cacheKey = `category-metadata-${category.id}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      
      if (cachedData) {
        // Use cached metadata if available
        try {
          const path = JSON.parse(cachedData);
          const currentCategoryInPath = path.find((item: any) => item.category.id === category.id);
          if (currentCategoryInPath && currentCategoryInPath.label !== "Category") {
            setFormData(prev => ({ ...prev, labelKey: currentCategoryInPath.label }));
          }
        } catch (error) {
          console.error('Error parsing cached metadata:', error);
        }
      } else {
        // Fetch from API and cache result
        fetch(`/api/categories/${category.id}/path`)
          .then(response => response.json())
          .then(path => {
            // Cache the result for 5 minutes
            sessionStorage.setItem(cacheKey, JSON.stringify(path));
            setTimeout(() => sessionStorage.removeItem(cacheKey), 5 * 60 * 1000);
            
            if (path && path.length > 0) {
              const currentCategoryInPath = path.find((item: any) => item.category.id === category.id);
              if (currentCategoryInPath && currentCategoryInPath.label !== "Category") {
                setFormData(prev => ({ ...prev, labelKey: currentCategoryInPath.label }));
              }
            }
          })
          .catch(error => console.error('Error loading category metadata:', error));
      }
    } else if (parentCategory) {
      // Add child mode
      setFormData({
        name: "",
        slug: "",
        parentId: parentCategory.id,
        icon: null,
        sortOrder: 0,
        isActive: true,
        labelKey: "",
      });
    } else {
      // Add root category mode
      setFormData({
        name: "",
        slug: "",
        parentId: null,
        icon: null,
        sortOrder: 0,
        isActive: true,
        labelKey: "",
      });
    }
    setErrors({});
    setIconFile(null); // Clear file input state when form opens
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

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.includes('png')) {
        setErrors(prev => ({ ...prev, icon: 'Sadece PNG formatı kabul edilir' }));
        return;
      }
      
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, icon: 'Dosya boyutu 2MB\'dan küçük olmalıdır' }));
        return;
      }
      
      setIconFile(file);
      setErrors(prev => ({ ...prev, icon: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    let iconPath = formData.icon;
    
    // Upload icon if a new file is selected
    if (iconFile) {
      const iconFormData = new FormData();
      iconFormData.append('icon', iconFile);
      
      try {
        const response = await fetch('/api/categories/upload-icon', {
          method: 'POST',
          body: iconFormData,
        });
        
        if (response.ok) {
          const result = await response.json();
          iconPath = result.filename;
        }
      } catch (error) {
        console.error('Icon upload failed:', error);
      }
    }
    
    // Handle icon submission properly
    const submitData = { ...formData };
    if (iconPath) {
      // New icon uploaded
      submitData.icon = iconPath;
    } else if (formData.icon === null) {
      // Icon explicitly removed
      submitData.icon = null;
    } else if (!formData.icon && !iconFile) {
      // No icon at all (new category without icon)
      delete submitData.icon;
    }
    
    // Pass labelKey to parent component for handling
    onSubmit(submitData, formData.labelKey.trim() || undefined);
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

          {/* Category Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori Etiketi
            </label>
            <input
              type="text"
              value={formData.labelKey}
              onChange={(e) => setFormData(prev => ({ ...prev, labelKey: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
              placeholder="Örn: Ana Kategori, Marka, Seri, Model"
            />
            <p className="text-xs text-gray-500 mt-1">
              Bu kategori hiyerarşisinde hangi etikete sahip? (Boş bırakılırsa "Category" kullanılır)
            </p>
          </div>



          {/* Category Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori İkonu
            </label>
            <div className="space-y-2">
              {formData.icon && (
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <img
                    src={`/uploads/category-icons/${formData.icon}`}
                    alt="Category icon"
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-sm text-gray-600">{formData.icon}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, icon: null }));
                      setIconFile(null);
                    }}
                    className="text-red-600 hover:text-red-800"
                    title="İkonu kaldır"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                type="file"
                accept=".png"
                onChange={handleIconUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
              />
              {errors.icon && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.icon}
                </p>
              )}
              <p className="text-xs text-gray-500">Sadece PNG formatı kabul edilir. Maksimum 2MB.</p>
            </div>
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