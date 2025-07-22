import { useState, useMemo, useEffect } from "react";
import { Plus, Search, FolderTree, AlertTriangle, CheckCircle, Info, ArrowLeft, ChevronRight, Edit, Trash2, GripVertical, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Sortable from "sortablejs";
import PageHeader from "@/components/PageHeader";
import CategoryForm from "@/components/CategoryForm";
import CustomFieldsModal from "@/components/CustomFieldsModal";
import { useCategoriesTree, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import type { Category, InsertCategory, UpdateCategory } from "@shared/schema";

export default function Categories() {
  const [location, setLocation] = useLocation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAlert, setShowAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = useState(false);
  const [customFieldsCategory, setCustomFieldsCategory] = useState<Category | null>(null);
  
  const queryClient = useQueryClient();

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
  
  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ parentId, categoryIds }: { parentId: number | null; categoryIds: number[] }) => {
      const response = await fetch('/api/categories/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId, categoryIds })
      });
      if (!response.ok) throw new Error('Failed to reorder categories');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      showAlertMessage('success', 'Kategori sıralaması başarıyla güncellendi', 1000);
    },
    onError: (error) => {
      showAlertMessage('error', 'Sıralama güncellenirken hata oluştu');
      console.error('Reorder error:', error);
    }
  });

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
  const showAlertMessage = (type: 'success' | 'error' | 'info', message: string, duration: number = 5000) => {
    setShowAlert({ type, message });
    setTimeout(() => setShowAlert(null), duration);
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
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'string' ? error : 
                          'Bir hata oluştu';
      showAlertMessage('error', errorMessage);
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
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'string' ? error : 
                          'Kategori silinirken bir hata oluştu';
      showAlertMessage('error', errorMessage);
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

  // Handle custom fields
  const handleCustomFields = (category: Category) => {
    setCustomFieldsCategory(category);
    setIsCustomFieldsOpen(true);
  };

  const isAnyMutationLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  // Initialize SortableJS for categories
  useEffect(() => {
    // Use setTimeout to ensure DOM is ready
    const timer = setTimeout(() => {
      const sortableElement = document.querySelector("#hs-category-sortable");
      if (sortableElement && filteredCategories.length > 1) {
        // Destroy existing sortable instance if it exists
        const existingSortable = (sortableElement as any).sortableInstance;
        if (existingSortable) {
          existingSortable.destroy();
          (sortableElement as any).sortableInstance = null;
        }

        const sortableInstance = new Sortable(sortableElement as HTMLElement, {
          animation: 150,
          dragClass: 'rounded-none!',
          handle: '.drag-handle',
          onEnd: function (evt) {
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;
            
            if (oldIndex !== newIndex && oldIndex !== undefined && newIndex !== undefined) {
              // Create new array with reordered categories
              const reorderedCategories = [...filteredCategories];
              const [draggedCategory] = reorderedCategories.splice(oldIndex, 1);
              reorderedCategories.splice(newIndex, 0, draggedCategory);
              
              // Extract category IDs in new order
              const categoryIds = reorderedCategories.map(cat => cat.id);
              

              
              // Send reorder request to backend
              reorderMutation.mutate({
                parentId: currentParent?.id || null,
                categoryIds: categoryIds
              });
            }
          }
        });

        // Store instance for cleanup
        (sortableElement as any).sortableInstance = sortableInstance;
      }
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      const sortableElement = document.querySelector("#hs-category-sortable");
      if (sortableElement) {
        const existingSortable = (sortableElement as any).sortableInstance;
        if (existingSortable) {
          existingSortable.destroy();
          (sortableElement as any).sortableInstance = null;
        }
      }
    };
  }, [filteredCategories, updateMutation]);

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
          currentParent ? (
            <button 
              onClick={handleBackClick}
              className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 flex flex-col">
        {/* Category List */}
        <div className="w-full bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            {/* Breadcrumb Navigation */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
              <button
                onClick={() => setLocation('/admin/categories')}
                className={`hover:text-[#EC7830] transition-colors ${
                  !currentParentId ? 'text-[#EC7830] font-medium' : ''
                }`}
              >
                Ana Kategoriler
              </button>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id} className="flex items-center gap-x-2">
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
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Kategori ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="py-2 px-4 pl-10 pr-4 w-full sm:w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent text-sm"
                />
              </div>

              {/* Add Category Button */}
              <button 
                onClick={handleAddRootCategory}
                disabled={isAnyMutationLoading}
                className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d6691a] focus:outline-hidden focus:bg-[#d6691a] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center sm:justify-start"
              >
                <Plus className="w-4 h-4" />
                {currentParent ? 'Alt Kategori Ekle' : 'Ana Kategori Ekle'}
              </button>
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
              <ul id="hs-category-sortable" className="flex flex-col">
                {filteredCategories.map((category, index) => {
                  const childrenCount = (category as any).children ? (category as any).children.length : 0;
                  return (
                    <li
                      key={category.id}
                      data-category-id={category.id}
                      className="inline-flex items-center gap-x-3 py-3 px-4 text-sm font-medium bg-white border border-gray-200 text-gray-800 -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg hover:bg-gray-50 transition-all duration-150 group relative sortable-item"
                      onClick={() => handleCategoryClick(category)}
                    >
                      {/* Icon */}
                      {category.icon ? (
                        <img
                          src={`/uploads/category-icons/${category.icon}`}
                          alt={`${category.name} icon`}
                          className="shrink-0 w-4 h-4 object-contain"
                        />
                      ) : (
                        <FolderTree className="shrink-0 w-4 h-4 text-gray-400" />
                      )}
                      
                      {/* Category Name */}
                      <div className="flex-1 text-left">
                        <span className="font-medium">{category.name}</span>
                        {childrenCount > 0 && (
                          <span className="text-gray-500 ml-1">({childrenCount})</span>
                        )}
                      </div>
                      
                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        category.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                      
                      {/* Sort Order */}
                      <span className="text-gray-500 text-xs min-w-[2rem] text-center">
                        #{category.sortOrder}
                      </span>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddChild(category);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Alt kategori ekle"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCustomFields(category);
                          }}
                          className="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded"
                          title="Özel alanlar"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(category);
                          }}
                          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(category);
                          }}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Sil"
                          disabled={isAnyMutationLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Drag Handle */}
                      <GripVertical className="shrink-0 w-4 h-4 text-gray-400 drag-handle cursor-grab hover:cursor-grabbing" />
                    </li>
                  );
                })}
              </ul>
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
        category={editingCategory || undefined}
        parentCategory={parentCategory || undefined}
        categories={categories}
        isLoading={isAnyMutationLoading}
      />

      {/* Custom Fields Modal */}
      {customFieldsCategory && (
        <CustomFieldsModal
          isOpen={isCustomFieldsOpen}
          onClose={() => {
            setIsCustomFieldsOpen(false);
            setCustomFieldsCategory(null);
          }}
          category={customFieldsCategory}
        />
      )}
    </div>
  );
}