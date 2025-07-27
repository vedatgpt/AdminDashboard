import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Package, AlertTriangle, CheckCircle, Info, Edit, Trash2, GripVertical } from "lucide-react";
import Sortable from 'sortablejs';
import PageHeader from "@/components/PageHeader";
import ListingPackageForm from "@/components/ListingPackageForm";
import { useListingPackages, useCreateListingPackage, useUpdateListingPackage, useDeleteListingPackage, useReorderListingPackages } from "@/hooks/useListingPackages";
import type { ListingPackage, InsertListingPackage, UpdateListingPackage } from "@shared/schema";

export default function ListingPackages() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ListingPackage | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAlert, setShowAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Queries and mutations
  const { data: packages = [], isLoading, error } = useListingPackages();
  const createMutation = useCreateListingPackage();
  const updateMutation = useUpdateListingPackage();
  const deleteMutation = useDeleteListingPackage();
  const reorderMutation = useReorderListingPackages();

  // Show alert helper
  const showAlertMessage = (type: 'success' | 'error' | 'info', message: string, duration: number = 5000) => {
    setShowAlert({ type, message });
    setTimeout(() => setShowAlert(null), duration);
  };

  // Initialize sortable
  useEffect(() => {
    const packageList = document.getElementById('hs-package-sortable');
    if (packageList && packages.length > 0) {
      const sortable = Sortable.create(packageList, {
        animation: 150,
        handle: '.drag-handle',
        onUpdate: function(evt) {
          if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
            const packageIds = Array.from(packageList.children).map(child => 
              parseInt(child.getAttribute('data-package-id') || '0')
            );
            reorderMutation.mutate(packageIds);
          }
        }
      });

      return () => {
        sortable.destroy();
      };
    }
  }, [packages, reorderMutation]);

  // Filter packages based on search term
  const filteredPackages = useMemo(() => {
    if (!searchTerm.trim()) return packages;
    
    return packages.filter(pkg =>
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [packages, searchTerm]);

  // Helper function to parse features JSON
  const parseFeatures = (features: string | null): string[] => {
    if (!features) return [];
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Handle form submission
  const handleFormSubmit = (data: InsertListingPackage | UpdateListingPackage) => {
    if (editingPackage) {
      updateMutation.mutate(
        { id: editingPackage.id, data: data as UpdateListingPackage },
        {
          onSuccess: () => {
            showAlertMessage('success', 'İlan paketi başarıyla güncellendi');
            setIsFormOpen(false);
            setEditingPackage(null);
          },
          onError: (error) => {
            showAlertMessage('error', error.message);
          }
        }
      );
    } else {
      createMutation.mutate(
        data as InsertListingPackage,
        {
          onSuccess: () => {
            showAlertMessage('success', 'İlan paketi başarıyla oluşturuldu');
            setIsFormOpen(false);
          },
          onError: (error) => {
            showAlertMessage('error', error.message);
          }
        }
      );
    }
  };

  // Handle delete
  const handleDelete = (listingPackage: ListingPackage) => {
    if (window.confirm(`"${listingPackage.name}" paketini silmek istediğinizden emin misiniz?`)) {
      deleteMutation.mutate(listingPackage.id, {
        onSuccess: () => {
          showAlertMessage('success', 'İlan paketi başarıyla silindi');
        },
        onError: (error) => {
          showAlertMessage('error', error.message);
        }
      });
    }
  };

  // Handle edit
  const handleEdit = (listingPackage: ListingPackage) => {
    setEditingPackage(listingPackage);
    setIsFormOpen(true);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">İlan paketleri yüklenirken hata oluştu</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="İlan Paketleri" 
        subtitle="Kategori bazlı ilan paketlerini yönetin"
      />

      {/* Alert */}
      {showAlert && (
        <div className={`p-4 rounded-lg border flex items-center space-x-3 ${
          showAlert.type === 'success' ? 'bg-green-50 border-green-200' :
          showAlert.type === 'error' ? 'bg-red-50 border-red-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          {showAlert.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
          {showAlert.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600" />}
          {showAlert.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
          <span className={
            showAlert.type === 'success' ? 'text-green-800' :
            showAlert.type === 'error' ? 'text-red-800' :
            'text-blue-800'
          }>
            {showAlert.message}
          </span>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="İlan paketi ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
          />
        </div>

        {/* Add Button */}
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#EC7830] border border-transparent rounded-lg hover:bg-[#d96b2a] focus:ring-2 focus:ring-[#EC7830] focus:ring-offset-2 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni İlan Paketi
        </button>
      </div>

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC7830]"></div>
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "Aradığınız kriterlere uygun paket bulunamadı" : "Henüz hiç ilan paketi yok"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? "Farklı anahtar kelimeler deneyebilirsiniz." : "İlk ilan paketinizi oluşturmak için butona tıklayın."}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#EC7830] border border-transparent rounded-lg hover:bg-[#d96b2a] focus:ring-2 focus:ring-[#EC7830] focus:ring-offset-2 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  İlk İlan Paketinizi Oluşturun
                </button>
              )}
            </div>
          ) : (
            <ul id="hs-package-sortable" className="flex flex-col">
              {filteredPackages.map((listingPackage) => {
                const features = parseFeatures(listingPackage.features);
                const priceInTL = Math.floor(listingPackage.basePrice / 100);
                
                return (
                  <li
                    key={listingPackage.id}
                    data-package-id={listingPackage.id}
                    className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-[#EC7830] hover:shadow-sm transition-all duration-200 mb-3 last:mb-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Drag Handle */}
                        <div className="drag-handle cursor-move opacity-30 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-5 h-5 text-gray-400" />
                        </div>

                        {/* Package Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="font-medium text-gray-900">{listingPackage.name}</h3>
                            <div className="flex items-center space-x-2">
                              {/* Status Badge */}
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                listingPackage.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {listingPackage.isActive ? 'Aktif' : 'Pasif'}
                              </span>

                              {/* Price Badge */}
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {priceInTL === 0 ? 'Ücretsiz' : `${priceInTL} TL`}
                              </span>

                              {/* Duration Badge */}
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {listingPackage.durationDays} gün
                              </span>

                              {/* Max Photos Badge */}
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {listingPackage.maxPhotos} fotoğraf
                              </span>
                            </div>
                          </div>

                          {/* Description */}
                          {listingPackage.description && (
                            <p className="text-sm text-gray-600 mb-2">{listingPackage.description}</p>
                          )}

                          {/* Features */}
                          {features.length > 0 && (
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">Özellikler:</span> {features.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(listingPackage)}
                          className="p-2 text-gray-400 hover:text-[#EC7830] hover:bg-orange-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(listingPackage)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <ListingPackageForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPackage(null);
        }}
        onSubmit={handleFormSubmit}
        listingPackage={editingPackage}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}