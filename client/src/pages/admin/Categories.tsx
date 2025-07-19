import { useState } from "react";
import { Plus, Search, FolderTree, AlertTriangle, CheckCircle, Info } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import CategoryTree from "@/components/CategoryTree";
import CategoryForm from "@/components/CategoryForm";
import { useCategoriesTree, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import type { Category, InsertCategory, UpdateCategory } from "@shared/schema";

export default function Categories() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAlert, setShowAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Queries and mutations
  const { data: categories = [], isLoading, error } = useCategoriesTree();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // Filter categories based on search term
  const filterCategories = (cats: Category[], term: string): Category[] => {
    if (!term) return cats;
    
    return cats.filter(cat => {
      const matches = cat.name.toLowerCase().includes(term.toLowerCase()) ||
                     (cat.description && cat.description.toLowerCase().includes(term.toLowerCase()));
      
      // Also include if any children match
      const childMatches = (cat as any).children ? 
        filterCategories((cat as any).children, term).length > 0 : false;
      
      return matches || childMatches;
    }).map(cat => ({
      ...cat,
      children: (cat as any).children ? filterCategories((cat as any).children, term) : undefined
    }));
  };

  const filteredCategories = filterCategories(categories, searchTerm);

  // Calculate total category count (including children)
  const countCategories = (cats: Category[]): number => {
    return cats.reduce((count, cat) => {
      return count + 1 + ((cat as any).children ? countCategories((cat as any).children) : 0);
    }, 0);
  };

  const totalCategories = countCategories(categories);

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

  // Handle category deletion
  const handleDelete = async (category: Category) => {
    if (!confirm(`"${category.name}" kategorisini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(category.id);
      showAlertMessage('success', 'Kategori başarıyla silindi');
      if (selectedCategory?.id === category.id) {
        setSelectedCategory(null);
      }
    } catch (error: any) {
      showAlertMessage('error', error.message || 'Kategori silinirken bir hata oluştu');
    }
  };

  // Handle adding new root category
  const handleAddRootCategory = () => {
    setEditingCategory(null);
    setParentCategory(null);
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
        subtitle={`Toplam ${totalCategories} kategori`}
        actions={
          <button 
            onClick={handleAddRootCategory}
            disabled={isAnyMutationLoading}
            className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d6691a] focus:outline-hidden focus:bg-[#d6691a] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Ana Kategori Ekle
          </button>
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

          <div className="border border-gray-200 rounded-lg p-4 max-h-[400px] lg:max-h-[600px] overflow-y-auto">
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
            ) : (
              <CategoryTree
                categories={filteredCategories}
                onSelect={setSelectedCategory}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddChild={handleAddChild}
                selectedId={selectedCategory?.id}
              />
            )}
          </div>
        </div>

        {/* Right Panel - Category Details */}
        <div className="w-full lg:w-1/3 bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kategori Detayları</h2>
          
          {selectedCategory ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Adı</label>
                <p className="text-gray-900 font-medium break-words">{selectedCategory.name}</p>
              </div>

              {selectedCategory.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <p className="text-gray-700 break-words">{selectedCategory.description}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                <p className="text-gray-700 font-mono text-sm bg-gray-100 px-2 py-1 rounded break-all">
                  {selectedCategory.slug}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İlan Sayısı</label>
                  <p className="text-2xl font-bold text-[#EC7830]">{selectedCategory.adCount || 0}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    selectedCategory.isActive 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {selectedCategory.isActive ? "Aktif" : "Pasif"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Oluşturulma Tarihi</label>
                <p className="text-gray-700 text-sm">
                  {new Date(selectedCategory.createdAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div className="pt-4 border-t space-y-2">
                <button
                  onClick={() => handleEdit(selectedCategory)}
                  className="w-full py-2 px-3 text-sm font-medium text-[#EC7830] bg-orange-50 rounded-lg hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
                >
                  Kategoriyi Düzenle
                </button>
                <button
                  onClick={() => handleAddChild(selectedCategory)}
                  className="w-full py-2 px-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  Alt Kategori Ekle
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FolderTree className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Detayları görmek için bir kategori seçin</p>
            </div>
          )}
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