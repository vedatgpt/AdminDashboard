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

  // Filter packages based on search
  const filteredPackages = useMemo(() => {
    if (!searchTerm) return packages;
    return packages.filter(pkg => 
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.description && pkg.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [packages, searchTerm]);

  // Initialize sortable for drag & drop reordering
  useEffect(() => {
    const timer = setTimeout(() => {
      const sortableElement = document.querySelector("#hs-package-sortable");
      if (sortableElement && filteredPackages.length > 1) {
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
              // Create new array with reordered packages
              const reorderedPackages = [...filteredPackages];
              const [draggedPackage] = reorderedPackages.splice(oldIndex, 1);
              reorderedPackages.splice(newIndex, 0, draggedPackage);
              
              // Extract package IDs in new order
              const packageIds = reorderedPackages.map(pkg => pkg.id);
              
              // Send reorder request to backend
              reorderMutation.mutate(packageIds);
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
      const sortableElement = document.querySelector("#hs-package-sortable");
      if (sortableElement) {
        const existingSortable = (sortableElement as any).sortableInstance;
        if (existingSortable) {
          existingSortable.destroy();
          (sortableElement as any).sortableInstance = null;
        }
      }
    };
  }, [filteredPackages, reorderMutation]);

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

  // Handle add new package
  const handleAddNew = () => {
    setEditingPackage(null);
    setIsFormOpen(true);
  };

  // Handle form submission
  const handleFormSubmit = async (data: InsertListingPackage | UpdateListingPackage) => {
    try {
      if (editingPackage) {
        await updateMutation.mutateAsync({ id: editingPackage.id, data: data as UpdateListingPackage });
        showAlertMessage('success', 'İlan paketi başarıyla güncellendi');
      } else {
        await createMutation.mutateAsync(data as InsertListingPackage);
        showAlertMessage('success', 'İlan paketi başarıyla oluşturuldu');
      }
      setIsFormOpen(false);
      setEditingPackage(null);
    } catch (error: any) {
      showAlertMessage('error', error.message || 'İşlem başarısız');
    }
  };

  // Handle delete
  const handleDelete = async (listingPackage: ListingPackage) => {
    if (confirm(`"${listingPackage.name}" paketini silmek istediğinize emin misiniz?`)) {
      try {
        await deleteMutation.mutateAsync(listingPackage.id);
        showAlertMessage('success', 'İlan paketi başarıyla silindi');
      } catch (error: any) {
        showAlertMessage('error', error.message || 'Silme işlemi başarısız');
      }
    }
  };

  // Handle edit
  const handleEdit = (listingPackage: ListingPackage) => {
    setEditingPackage(listingPackage);
    setIsFormOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Alert */}
      {showAlert && (
        <div className={`rounded-lg border p-4 mb-4 flex items-center space-x-3 ${
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

      <PageHeader
        title="İlan Paketleri"
        subtitle={`${filteredPackages.length} paket`}
      />

      <div className="flex-1 flex flex-col">
        {/* Package List */}
        <div className="w-full bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            {/* Title */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-[#EC7830] font-medium">İlan Paketleri</span>
            </div>
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
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
                disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
                className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d6691a] focus:outline-hidden focus:bg-[#d6691a] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center sm:justify-start"
              >
                <Plus className="w-4 h-4" />
                Yeni Paket
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#EC7830] border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">İlan paketleri yükleniyor...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
                <p>İlan paketleri yüklenirken bir hata oluştu</p>
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>{searchTerm ? 'Paket bulunamadı' : 'Henüz ilan paketi oluşturulmamış'}</p>
                <p className="text-sm mt-1">
                  {searchTerm 
                    ? 'Arama kriterlerinize uygun paket bulunamadı.' 
                    : 'Başlamak için "Yeni Paket" butonunu kullanın'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={handleAddNew}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#EC7830] hover:bg-[#d6691a] mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Paketi Oluştur
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
                      className="inline-flex items-center gap-x-3 py-3 px-4 text-sm font-medium bg-white border border-gray-200 text-gray-800 -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg hover:bg-gray-50 transition-all duration-150 group relative sortable-item"
                    >
                      {/* Package Icon */}
                      <Package className="shrink-0 w-4 h-4 text-gray-400" />
                      
                      {/* Package Name and Details */}
                      <div className="flex-1 text-left">
                        <div className="font-medium">{listingPackage.name}</div>
                        {listingPackage.description && (
                          <div className="text-xs text-gray-500 mt-1">{listingPackage.description}</div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span>{priceInTL} TL</span>
                          <span>{listingPackage.durationDays} gün</span>
                          <span>{listingPackage.maxPhotos} fotoğraf</span>
                          {features.length > 0 && <span>{features.length} özellik</span>}
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        listingPackage.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {listingPackage.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                      
                      {/* Sort Order */}
                      <span className="text-gray-500 text-xs min-w-[2rem] text-center">
                        #{listingPackage.sortOrder}
                      </span>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(listingPackage);
                          }}
                          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(listingPackage);
                          }}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Sil"
                          disabled={deleteMutation.isPending}
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