import { useState, useMemo, useEffect } from "react";
import { X, Plus, Search, Edit, Trash2, GripVertical, AlertTriangle, CheckCircle, Info } from "lucide-react";
import Sortable from "sortablejs";
import ListingPackageForm from "./ListingPackageForm";
import { useListingPackages, useCreateListingPackage, useUpdateListingPackage, useDeleteListingPackage, useReorderListingPackages } from "@/hooks/useListingPackages";
import type { Category, ListingPackage } from "@shared/schema";

interface CategoryPackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
}

export default function CategoryPackagesModal({ isOpen, onClose, category }: CategoryPackagesModalProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ListingPackage | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAlert, setShowAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Fetch packages
  const { data: allPackages = [], isLoading } = useListingPackages();
  const createMutation = useCreateListingPackage();
  const updateMutation = useUpdateListingPackage();
  const deleteMutation = useDeleteListingPackage();
  const reorderMutation = useReorderListingPackages();

  // Filter packages for this category only (for now show all, will implement category filtering later)
  const categoryPackages = useMemo(() => {
    // TODO: Implement proper category-package relationship filtering
    return allPackages as ListingPackage[];
  }, [allPackages]);

  // Apply search filter
  const filteredPackages = useMemo(() => {
    if (!searchTerm) return categoryPackages;
    return categoryPackages.filter(pkg => 
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.description && pkg.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [categoryPackages, searchTerm]);

  const showAlertMessage = (type: 'success' | 'error' | 'info', message: string, duration = 3000) => {
    setShowAlert({ type, message });
    setTimeout(() => setShowAlert(null), duration);
  };

  const isAnyMutationLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || reorderMutation.isPending;

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingPackage) {
        await updateMutation.mutateAsync({ id: editingPackage.id, data });
        showAlertMessage('success', 'İlan paketi başarıyla güncellendi');
      } else {
        // Add category ID to the package data
        const packageData = {
          ...data,
          selectedCategories: [category.id], // Automatically associate with current category
        };
        await createMutation.mutateAsync(packageData);
        showAlertMessage('success', 'İlan paketi başarıyla oluşturuldu');
      }
      setIsFormOpen(false);
      setEditingPackage(null);
    } catch (error: any) {
      showAlertMessage('error', error.message || 'Bir hata oluştu');
    }
  };

  const handleEdit = (pkg: ListingPackage) => {
    setEditingPackage(pkg);
    setIsFormOpen(true);
  };

  const handleDelete = async (pkg: ListingPackage) => {
    if (window.confirm(`"${pkg.name}" paketini silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteMutation.mutateAsync(pkg.id);
        showAlertMessage('success', 'İlan paketi başarıyla silindi');
      } catch (error: any) {
        showAlertMessage('error', error.message || 'Silme işlemi başarısız');
      }
    }
  };

  const handleAddNew = () => {
    setEditingPackage(null);
    setIsFormOpen(true);
  };

  // Initialize sortable for drag & drop reordering
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const sortableElement = document.querySelector("#category-packages-sortable");
      if (sortableElement && filteredPackages.length > 0) {
        // Clear existing sortable instance
        const existingSortable = (sortableElement as any).sortableInstance;
        if (existingSortable) {
          existingSortable.destroy();
        }

        const sortableInstance = Sortable.create(sortableElement as HTMLElement, {
          handle: '.drag-handle',
          animation: 150,
          ghostClass: 'sortable-ghost',
          chosenClass: 'sortable-chosen',
          dragClass: 'sortable-drag',
          onEnd: function(evt) {
            if (evt.oldIndex !== evt.newIndex && evt.oldIndex !== undefined && evt.newIndex !== undefined) {
              const packageIds = Array.from(sortableElement.children).map((el: any) => 
                parseInt(el.getAttribute('data-package-id'))
              );
              
              reorderMutation.mutate(packageIds);
            }
          }
        });

        (sortableElement as any).sortableInstance = sortableInstance;
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      const sortableElement = document.querySelector("#category-packages-sortable");
      if (sortableElement) {
        const existingSortable = (sortableElement as any).sortableInstance;
        if (existingSortable) {
          existingSortable.destroy();
          (sortableElement as any).sortableInstance = null;
        }
      }
    };
  }, [isOpen, filteredPackages, reorderMutation]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                İlan Paketleri - {category.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                "{category.name}" kategorisi için özel ilan paketleri
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Alert */}
        {showAlert && (
          <div className={`mx-6 mt-4 p-4 rounded-lg flex items-center ${
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Paket ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-2 px-4 pl-10 pr-4 w-full sm:w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent text-sm"
              />
            </div>

            {/* Add Package Button */}
            <button 
              onClick={handleAddNew}
              disabled={isAnyMutationLoading}
              className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d6691a] focus:outline-hidden focus:bg-[#d6691a] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center sm:justify-start"
            >
              <Plus className="w-4 h-4" />
              Yeni Paket
            </button>
          </div>

          {/* Package List */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Paketler yükleniyor...</div>
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                {searchTerm ? 'Arama kriterlerine uygun paket bulunamadı.' : 'Bu kategori için henüz paket tanımlanmamış.'}
              </div>
              {!searchTerm && (
                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#EC7830] bg-white border border-[#EC7830] rounded-lg hover:bg-orange-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  İlk Paketi Oluştur
                </button>
              )}
            </div>
          ) : (
            <div id="category-packages-sortable" className="space-y-3">
              {filteredPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  data-package-id={pkg.id}
                  className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-[#EC7830]/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Drag Handle */}
                      <div className="drag-handle cursor-move text-gray-400 hover:text-gray-600">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      
                      {/* Package Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">{pkg.name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            pkg.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {pkg.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            pkg.membershipType === 'individual' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {pkg.membershipType === 'individual' ? 'Bireysel' : 'Kurumsal'}
                          </span>
                        </div>
                        {pkg.description && (
                          <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>₺{(pkg.basePrice / 100).toLocaleString()}</span>
                          <span>{pkg.durationDays} gün</span>
                          <span>Max {pkg.maxPhotos} fotoğraf</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(pkg)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
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

      {/* Package Form Modal */}
      <ListingPackageForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPackage(null);
        }}
        onSubmit={handleFormSubmit}
        listingPackage={editingPackage}
        isLoading={isAnyMutationLoading}
        packageType="individual" // Default to individual, can be made dynamic
      />
    </div>
  );
}