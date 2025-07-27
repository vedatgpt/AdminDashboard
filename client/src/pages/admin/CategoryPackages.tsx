import { useState } from "react";
import { Package, Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";
import CategoryPackageForm from "@/components/CategoryPackageForm";
import { useCategoriesTree } from "@/hooks/useCategories";
import { useCategoryPackages, useDeleteCategoryPackage } from "@/hooks/useCategoryPackages";
import type { CategoryPackage, Category } from "@shared/schema";

export default function CategoryPackages() {
  const [location, setLocation] = useLocation();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CategoryPackage | null>(null);

  // Get categories data
  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesTree();

  // Get category packages for selected category
  const { 
    data: packages = [], 
    isLoading: packagesLoading 
  } = useCategoryPackages(selectedCategoryId || 0);

  const deleteMutation = useDeleteCategoryPackage();

  // Get all categories flattened for easy selection
  const flattenCategories = (cats: Category[]): Category[] => {
    let flat: Category[] = [];
    for (const cat of cats) {
      flat.push(cat);
      if ((cat as any).children) {
        flat = flat.concat(flattenCategories((cat as any).children));
      }
    }
    return flat;
  };

  const allCategories = flattenCategories(categories);
  const selectedCategory = allCategories.find(cat => cat.id === selectedCategoryId);

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
  };

  const handleAddPackage = () => {
    setEditingPackage(null);
    setIsFormOpen(true);
  };

  const handleEditPackage = (pkg: CategoryPackage) => {
    setEditingPackage(pkg);
    setIsFormOpen(true);
  };

  const handleDeletePackage = async (pkg: CategoryPackage) => {
    if (confirm(`"${pkg.name}" paketini silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteMutation.mutateAsync({ 
          id: pkg.id, 
          categoryId: pkg.categoryId 
        });
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  const formatPrice = (priceInCents: number): string => {
    return `${(priceInCents / 100).toFixed(2)} TL`;
  };

  const parseFeatures = (featuresJson: string | null): string[] => {
    if (!featuresJson) return [];
    try {
      return JSON.parse(featuresJson);
    } catch {
      return [];
    }
  };

  const parseMembershipTypes = (typesJson: string | null): string[] => {
    if (!typesJson) return ["individual", "corporate"];
    try {
      return JSON.parse(typesJson);
    } catch {
      return ["individual", "corporate"];
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Kategori Paketleri"
        icon={Package}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Kategori Seçin
          </h3>
          
          {categoriesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC7830] mx-auto"></div>
              <p className="text-gray-500 mt-2">Kategoriler yükleniyor...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedCategoryId === category.id
                      ? 'bg-[#EC7830] text-white border-[#EC7830]'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{category.name}</span>
                    {category.categoryType && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedCategoryId === category.id
                          ? 'bg-white bg-opacity-20 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {category.categoryType}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category Packages */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedCategory ? `${selectedCategory.name} Paketleri` : "Paketler"}
            </h3>
            {selectedCategoryId && (
              <button
                onClick={handleAddPackage}
                className="flex items-center gap-2 px-4 py-2 bg-[#EC7830] text-white rounded-lg hover:bg-[#D6691A] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Yeni Paket
              </button>
            )}
          </div>

          {!selectedCategoryId ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                Paket yönetimi için bir kategori seçin
              </p>
            </div>
          ) : packagesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC7830] mx-auto"></div>
              <p className="text-gray-500 mt-2">Paketler yükleniyor...</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">
                Bu kategori için henüz paket oluşturulmamış
              </p>
              <button
                onClick={handleAddPackage}
                className="flex items-center gap-2 px-4 py-2 bg-[#EC7830] text-white rounded-lg hover:bg-[#D6691A] transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                İlk Paketi Oluştur
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{pkg.name}</h4>
                        {!pkg.isActive && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            Pasif
                          </span>
                        )}
                      </div>
                      
                      {pkg.description && (
                        <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                      )}
                      
                      <div className="text-sm text-gray-500 space-y-1">
                        <div className="flex items-center gap-4">
                          <span className="font-medium text-[#EC7830]">
                            {formatPrice(pkg.price)}
                          </span>
                          <span>{pkg.durationDays} gün</span>
                        </div>
                        
                        {pkg.features && (
                          <div>
                            <span className="text-xs font-medium text-gray-700">Özellikler: </span>
                            <span className="text-xs">
                              {parseFeatures(pkg.features).join(", ") || "Belirtilmemiş"}
                            </span>
                          </div>
                        )}
                        
                        {pkg.membershipTypes && (
                          <div>
                            <span className="text-xs font-medium text-gray-700">Üyelik: </span>
                            <span className="text-xs">
                              {parseMembershipTypes(pkg.membershipTypes).map(type => 
                                type === "individual" ? "Bireysel" : "Kurumsal"
                              ).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEditPackage(pkg)}
                        className="p-2 text-gray-400 hover:text-[#EC7830] transition-colors"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePackage(pkg)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Package Form Modal */}
      {selectedCategoryId && (
        <CategoryPackageForm
          categoryId={selectedCategoryId}
          package={editingPackage || undefined}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingPackage(null);
          }}
        />
      )}
    </div>
  );
}