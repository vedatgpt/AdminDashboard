import { useState, useMemo } from "react";
import { Plus, Search, FolderTree, AlertTriangle, CheckCircle, Info, ArrowLeft, ChevronRight, Edit, Trash2, GripVertical } from "lucide-react";
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

  // Build breadcrumb trail
  const breadcrumbs = useMemo(() => {
    if (!currentParentId || !categories.length) return [];
    
    const findPath = (cats: Category[], targetId: number, path: Category[] = []): Category[] | null => {
      for (const cat of cats) {
        const newPath = [...path, cat];
        if (cat.id === targetId) {
          return newPath;
        }
        if ((cat as any).children) {
          const result = findPath((cat as any).children, targetId, newPath);
          if (result) return result;
        }
      }
      return null;
    };
    
    return findPath(categories, currentParentId) || [];
  }, [categories, currentParentId]);

  // Filter current categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return currentCategories;
    return currentCategories.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
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
    setLocation(`/admin/categories/${category.id}`);
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
        title="Kategori Yönetimi"
        subtitle={`${filteredCategories.length} kategori`}
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {currentParent && (
              <button 
                onClick={handleBackClick}
                className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 w-full sm:w-auto justify-center sm:justify-start"
              >
                <ArrowLeft className="w-4 h-4" />
                Geri
              </button>
            )}
            <button 
              onClick={handleAddRootCategory}
              disabled={isAnyMutationLoading}
              className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d6691a] focus:outline-hidden focus:bg-[#d6691a] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center sm:justify-start"
            >
              <Plus className="w-4 h-4" />
              {currentParent ? 'Alt Kategori Ekle' : 'Ana Kategori Ekle'}
            </button>
          </div>
        }
      />

      <div className="flex-1 flex flex-col">
        {/* Category List */}
        <div className="w-full bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <button
                onClick={() => setLocation('/admin/categories')}
                className={`hover:text-[#EC7830] transition-colors ${
                  !currentParentId ? 'text-[#EC7830] font-medium' : ''
                }`}
              >
                Ana Kategoriler
              </button>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id} className="flex items-center space-x-2">
                  <span className="text-gray-400">/</span>
                  <button
                    onClick={() => setLocation(`/admin/categories/${crumb.id}`)}
                    className={`hover:text-[#EC7830] transition-colors ${
                      index === breadcrumbs.length - 1 ? 'text-[#EC7830] font-medium' : ''
                    }`}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>
            
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
                {filteredCategories.map((category, index) => {
                  const childrenCount = (category as any).children ? (category as any).children.length : 0;
                  return (
                    <div
                      key={category.id}
                      className="p-4 hover:bg-gray-50 transition-all duration-150 cursor-pointer group relative"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', index.toString());
                        e.dataTransfer.effectAllowed = 'move';
                        e.currentTarget.classList.add('opacity-50');
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.classList.remove('opacity-50');
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        e.currentTarget.classList.add('bg-blue-50', 'border-blue-300');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
                        
                        const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                        if (draggedIndex !== index && !isNaN(draggedIndex)) {
                          const draggedCategory = filteredCategories[draggedIndex];
                          const targetCategory = filteredCategories[index];
                          
                          // Immediate visual update
                          const newOrder = draggedIndex < index ? index + 1 : index;
                          
                          updateMutation.mutate({ 
                            id: draggedCategory.id, 
                            data: { sortOrder: newOrder } 
                          });
                          
                          // Update target category sort order if needed
                          if (targetCategory.sortOrder <= newOrder) {
                            updateMutation.mutate({ 
                              id: targetCategory.id, 
                              data: { sortOrder: targetCategory.sortOrder + 1 } 
                            });
                          }
                        }
                      }}
                      onClick={() => handleCategoryClick(category)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400 mr-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
                          <div className="flex-1">
                            <div className="flex items-center">
                              {category.icon && (
                                <img
                                  src={`/uploads/category-icons/${category.icon}`}
                                  alt={`${category.name} icon`}
                                  className="w-5 h-5 mr-2 object-contain"
                                />
                              )}
                              <h3 className="font-medium text-gray-900">
                                {category.name}
                                {childrenCount > 0 && (
                                  <span className="text-gray-500 ml-1">({childrenCount})</span>
                                )}
                              </h3>
                              <ChevronRight className="w-4 h-4 ml-2 text-gray-400" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddChild(category);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Alt kategori ekle"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(category);
                            }}
                            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(category);
                            }}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
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