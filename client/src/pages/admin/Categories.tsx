import { useState, useMemo } from "react";
import { Plus, Search, FolderTree, AlertTriangle, CheckCircle, Info, ArrowLeft, ChevronRight, Edit, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";
import CategoryForm from "@/components/CategoryForm";
import { useCategoriesTree, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import type { Category, InsertCategory, UpdateCategory } from "@shared/schema";

export default function Categories() {
  const [location, setLocation] = useLocation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAlert, setShowAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Extract current parent ID from URL
  const currentParentId = useMemo(() => {
    const match = location.match(/\/admin\/categories\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }, [location]);

  // Queries and mutations
  const { data: categories = [], isLoading, error } = useCategoriesTree();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // Get categories to display based on current parent
  const currentCategories = useMemo(() => {
    if (currentParentId === null) {
      // Show only root categories
      return categories.filter(cat => cat.parentId === null);
    } else {
      // Show children of current parent
      const findCategoryAndChildren = (cats: Category[]): Category[] => {
        for (const cat of cats) {
          if (cat.id === currentParentId) {
            return (cat as any).children || [];
          }
          if ((cat as any).children) {
            const found = findCategoryAndChildren((cat as any).children);
            if (found.length > 0) return found;
          }
        }
        return [];
      };
      return findCategoryAndChildren(categories);
    }
  }, [categories, currentParentId]);

  // Get current parent category for breadcrumb
  const currentParent = useMemo(() => {
    if (currentParentId === null) return null;
    
    const findCategory = (cats: Category[]): Category | null => {
      for (const cat of cats) {
        if (cat.id === currentParentId) return cat;
        if ((cat as any).children) {
          const found = findCategory((cat as any).children);
          if (found) return found;
        }
      }
      return null;
    };
    return findCategory(categories);
  }, [categories, currentParentId]);

  // Filter current categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return currentCategories;
    return currentCategories.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [currentCategories, searchTerm]);

  // Show alert helper
  const showAlertMessage = (type: 'success' | 'error' | 'info', message: string) => {
    setShowAlert({ type, message });
    setTimeout(() => setShowAlert(null), 5000);
  };

  // Handle form submission
  const handleFormSubmit = async (data: InsertCategory | UpdateCategory) => {
    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({ 
          id: editingCategory.id, 
          data: data as UpdateCategory 
        });
        showAlertMessage('success', 'Kategori başarıyla güncellendi');
      } else {
        await createMutation.mutateAsync(data as InsertCategory);
        showAlertMessage('success', 'Kategori başarıyla oluşturuldu');
      }
      
      setIsFormOpen(false);
      setEditingCategory(null);
      setParentCategory(null);
    } catch (error: any) {
      showAlertMessage('error', error.message || 'Bir hata oluştu');
    }
  };

  // Navigation functions
  const handleCategoryClick = (category: Category) => {
    const hasChildren = (category as any).children && (category as any).children.length > 0;
    if (hasChildren) {
      setLocation(`/admin/categories/${category.id}`);
    }
  };

  const handleBackClick = () => {
    if (currentParent && currentParent.parentId !== null) {
      setLocation(`/admin/categories/${currentParent.parentId}`);
    } else {
      setLocation('/admin/categories');
    }
  };

  // Handle category deletion
  const handleDelete = async (category: Category) => {
    if (!confirm(`"${category.name}" kategorisini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(category.id);
      showAlertMessage('success', 'Kategori başarıyla silindi');
    } catch (error: any) {
      showAlertMessage('error', error.message || 'Kategori silinirken bir hata oluştu');
    }
  };

  // Handle adding new root category
  const handleAddRootCategory = () => {
    setEditingCategory(null);
    setParentCategory(currentParent);
    setIsFormOpen(true);
  };

  // Handle adding child category
  const handleAddChild = (parentCat: Category) => {
    setEditingCategory(null);
    setParentCategory(parentCat);
    setIsFormOpen(true);
  };

  // Handle editing category
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setParentCategory(null);
    setIsFormOpen(true);
  };

  const isAnyMutationLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="h-full flex flex-col">
      {/* Alert */}
      {showAlert && (
        <div className={`mb-4 p-4 rounded-lg flex items-center ${
          showAlert.type === 'success' ? 'bg-green-50 text-green-800' :
          showAlert.type === 'error' ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          {showAlert.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
          {showAlert.type === 'error' && <AlertTriangle className="w-5 h-5 mr-2" />}
          {showAlert.type === 'info' && <Info className="w-5 h-5 mr-2" />}
          {showAlert.message}
        </div>
      )}

      <PageHeader
        title={currentParent ? `${currentParent.name} Kategorisi` : "Kategori Yönetimi"}
        subtitle={currentParent ? `${currentParent.name} alt kategorileri` : `${filteredCategories.length} ana kategori`}
        actions={
          <div className="flex items-center gap-2">
            {currentParent && (
              <button 
                onClick={handleBackClick}
                className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Geri
              </button>
            )}
            <button 
              onClick={handleAddRootCategory}
              disabled={isAnyMutationLoading}
              className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d6691a] focus:outline-hidden focus:bg-[#d6691a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {currentParent ? 'Alt Kategori Ekle' : 'Ana Kategori Ekle'}
            </button>
          </div>
        }
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* Left Panel - Category Tree */}
        <div className="w-full lg:w-2/3 bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FolderTree className="w-5 h-5 mr-2 text-[#EC7830]" />
              Kategori Ağacı
            </h2>
            
            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Kategori ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
              />
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#EC7830] border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Kategoriler yükleniyor...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
                <p>Kategoriler yüklenirken bir hata oluştu</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderTree className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>{currentParent ? 'Bu kategorinin alt kategorisi yok' : 'Henüz kategori oluşturulmamış'}</p>
                <p className="text-sm mt-1">{currentParent ? 'Alt kategori eklemek için yukarıdaki butonu kullanın' : 'Başlamak için "Ana Kategori Ekle" butonunu kullanın'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredCategories.map((category) => {
                  const hasChildren = (category as any).children && (category as any).children.length > 0;
                  return (
                    <div
                      key={category.id}
                      className="p-4 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className={`flex-1 ${hasChildren ? 'cursor-pointer' : ''}`}
                          onClick={() => hasChildren && handleCategoryClick(category)}
                        >
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h3 className="font-medium text-gray-900">{category.name}</h3>
                                {hasChildren && (
                                  <ChevronRight className="w-4 h-4 ml-2 text-gray-400" />
                                )}
                              </div>
                              {category.description && (
                                <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                              )}
                              <div className="flex items-center mt-2 text-xs text-gray-400 space-x-4">
                                <span>Slug: {category.slug}</span>
                                {hasChildren && (
                                  <span>{(category as any).children.length} alt kategori</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {hasChildren && (
                            <button
                              onClick={() => handleAddChild(category)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                              title="Alt kategori ekle"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            title="Sil"
                            disabled={isAnyMutationLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Breadcrumb and Info */}
        <div className="w-full lg:w-1/3 bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kategori Bilgileri</h2>
          
          {/* Breadcrumb */}
          {currentParent && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mevcut Konum</label>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">
                  Ana Kategoriler → {currentParent.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {currentParent.description || 'Açıklama yok'}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Kategori</label>
              <p className="text-2xl font-bold text-[#EC7830]">{filteredCategories.length}</p>
              <p className="text-xs text-gray-500">
                {currentParent ? 'Alt kategori sayısı' : 'Ana kategori sayısı'}
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Hızlı İşlemler</h3>
              <div className="space-y-2">
                <button
                  onClick={handleAddRootCategory}
                  disabled={isAnyMutationLoading}
                  className="w-full text-left px-3 py-2 text-sm bg-[#EC7830] text-white rounded hover:bg-[#d6691a] disabled:opacity-50"
                >
                  + {currentParent ? 'Alt Kategori Ekle' : 'Ana Kategori Ekle'}
                </button>
                {currentParent && (
                  <button
                    onClick={handleBackClick}
                    className="w-full text-left px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    ← Bir üst seviyeye dön
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCategory(null);
          setParentCategory(null);
        }}
        onSubmit={handleFormSubmit}
        category={editingCategory}
        parentCategory={parentCategory}
        categories={categories}
        isLoading={isAnyMutationLoading}
      />
    </div>
  );
}