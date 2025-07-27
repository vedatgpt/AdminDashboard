import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Package, AlertTriangle, CheckCircle, Info, Edit, Trash2, GripVertical } from "lucide-react";
import Sortable from 'sortablejs';
import PageHeader from "@/components/PageHeader";
import ListingPackageForm from "@/components/ListingPackageForm";
import { useListingPackages, useCreateListingPackage, useUpdateListingPackage, useDeleteListingPackage, useReorderListingPackages } from "@/hooks/useListingPackages";
import type { ListingPackage } from "@shared/schema";

export default function IndividualListingPackages() {
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

  // Filter only individual packages and search
  const filteredPackages = useMemo(() => {
    let individualPackages = (packages as ListingPackage[]).filter((pkg: ListingPackage) => {
      // For now, we'll assume all existing packages are individual
      // TODO: Add package type field to distinguish
      return true;
    });

    if (!searchTerm) return individualPackages;
    return individualPackages.filter(pkg => 
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

    return () => clearTimeout(timer);
  }, [filteredPackages, reorderMutation]);

  const handleCreate = async (data: any) => {
    try {
      // Ensure this is marked as individual package
      const packageData = {
        ...data,
        selectedMembershipTypes: ['individual']
      };
      
      await createMutation.mutateAsync(packageData);
      setIsFormOpen(false);
      showAlertMessage('success', `Bireysel paket "${packageData.name}" başarıyla oluşturuldu.`);
    } catch (error: any) {
      showAlertMessage('error', error.message || 'Bireysel paket oluşturulurken hata oluştu.');
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingPackage) return;
    
    try {
      // Ensure this is marked as individual package
      const packageData = {
        ...data,
        selectedMembershipTypes: ['individual']
      };
      
      await updateMutation.mutateAsync({ id: editingPackage.id, data: packageData });
      setEditingPackage(null);
      setIsFormOpen(false);
      showAlertMessage('success', `Bireysel paket "${packageData.name}" başarıyla güncellendi.`);
    } catch (error: any) {
      showAlertMessage('error', error.message || 'Bireysel paket güncellenirken hata oluştu.');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" isimli bireysel paketi silmek istediğinizden emin misiniz?`)) return;
    
    try {
      await deleteMutation.mutateAsync(id);
      showAlertMessage('success', `Bireysel paket "${name}" başarıyla silindi.`);
    } catch (error: any) {
      showAlertMessage('error', error.message || 'Bireysel paket silinirken hata oluştu.');
    }
  };

  const openEditForm = (pkg: ListingPackage) => {
    setEditingPackage(pkg);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingPackage(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC7830]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
          <p className="text-lg font-medium">Hata Oluştu</p>
          <p className="text-sm">Paketler yüklenirken bir hata oluştu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Alert Messages */}
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
        title="Bireysel İlan Paketleri"
        subtitle={`${filteredPackages.length} paket`}
      />

      <div className="flex-1 flex flex-col">
        {/* Package List */}
        <div className="w-full bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            {/* Title */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-[#EC7830] font-medium">Bireysel İlan Paketleri</span>
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
                onClick={() => setIsFormOpen(true)}
                disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
                className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d6691a] focus:outline-hidden focus:bg-[#d6691a] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center sm:justify-start"
              >
                <Plus className="w-4 h-4" />
                Yeni Bireysel Paket
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#EC7830] border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Bireysel paketler yükleniyor...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
                <p>Bireysel paketler yüklenirken bir hata oluştu</p>
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>{searchTerm ? 'Paket bulunamadı' : 'Henüz bireysel paket oluşturulmamış'}</p>
                <p className="text-sm mt-1">
                  {searchTerm 
                    ? 'Arama kriterlerinize uygun paket bulunamadı.' 
                    : 'Başlamak için "Yeni Bireysel Paket" butonunu kullanın'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#EC7830] hover:bg-[#d6691a] mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Bireysel Paketi Oluştur
                  </button>
                )}
              </div>
            ) : (
              <ul id="hs-package-sortable" className="flex flex-col">
                {filteredPackages.map((pkg) => {
                  const features = JSON.parse(pkg.features || "[]");
                  const priceInTL = Math.floor(pkg.basePrice / 100);
                  
                  return (
                    <li
                      key={pkg.id}
                      data-package-id={pkg.id}
                      className="inline-flex items-center gap-x-3 py-3 px-4 text-sm font-medium bg-white border border-gray-200 text-gray-800 -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg hover:bg-gray-50 transition-all duration-150 group relative sortable-item"
                    >
                      {/* Package Icon */}
                      <Package className="shrink-0 w-4 h-4 text-gray-400" />
                      
                      {/* Package Name and Details */}
                      <div className="flex-1 text-left">
                        <div className="font-medium">{pkg.name}</div>
                        {pkg.description && (
                          <div className="text-xs text-gray-500 mt-1">{pkg.description}</div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span>{priceInTL} TL</span>
                          <span>{pkg.durationDays} gün</span>
                          <span>Max {pkg.maxPhotos} fotoğraf</span>
                          {features.length > 0 && <span>{features.length} özellik</span>}
                        </div>
                      </div>
                      
                      {/* Type Badge */}
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Bireysel
                      </span>
                      
                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        pkg.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {pkg.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                      
                      {/* Sort Order */}
                      <span className="text-gray-500 text-xs min-w-[2rem] text-center">
                        #{pkg.sortOrder}
                      </span>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditForm(pkg)}
                          className="inline-flex items-center p-1 text-xs text-gray-400 hover:text-[#EC7830] hover:bg-orange-50 rounded transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(pkg.id, pkg.name)}
                          className="inline-flex items-center p-1 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      
                      {/* Drag Handle */}
                      <div className="drag-handle cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Package Form Modal */}
      <ListingPackageForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={editingPackage ? handleUpdate : handleCreate}
        listingPackage={editingPackage}
        isLoading={createMutation.isPending || updateMutation.isPending}
        packageType="individual"
      />
    </div>
  );
}