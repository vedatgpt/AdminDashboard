import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Package, AlertTriangle, CheckCircle, Info, Edit, Trash2, GripVertical } from "lucide-react";
import Sortable from 'sortablejs';
import PageHeader from "@/components/PageHeader";
import ListingPackageForm from "@/components/ListingPackageForm";
import { useListingPackages, useCreateListingPackage, useUpdateListingPackage, useDeleteListingPackage, useReorderListingPackages } from "@/hooks/useListingPackages";
import type { ListingPackage } from "@shared/schema";

export default function CorporateListingPackages() {
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

  // Filter only corporate packages and search
  const filteredPackages = useMemo(() => {
    let corporatePackages = (packages as ListingPackage[]).filter((pkg: ListingPackage) => {
      // For now, we'll assume no existing packages are corporate
      // TODO: Add package type field to distinguish
      return false;
    });

    if (!searchTerm) return corporatePackages;
    return corporatePackages.filter(pkg => 
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
      // Ensure this is marked as corporate package
      const packageData = {
        ...data,
        selectedMembershipTypes: ['corporate']
      };
      
      await createMutation.mutateAsync(packageData);
      setIsFormOpen(false);
      showAlertMessage('success', `Kurumsal paket "${packageData.name}" başarıyla oluşturuldu.`);
    } catch (error: any) {
      showAlertMessage('error', error.message || 'Kurumsal paket oluşturulurken hata oluştu.');
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingPackage) return;
    
    try {
      // Ensure this is marked as corporate package
      const packageData = {
        ...data,
        selectedMembershipTypes: ['corporate']
      };
      
      await updateMutation.mutateAsync({ id: editingPackage.id, data: packageData });
      setEditingPackage(null);
      setIsFormOpen(false);
      showAlertMessage('success', `Kurumsal paket "${packageData.name}" başarıyla güncellendi.`);
    } catch (error: any) {
      showAlertMessage('error', error.message || 'Kurumsal paket güncellenirken hata oluştu.');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" isimli kurumsal paketi silmek istediğinizden emin misiniz?`)) return;
    
    try {
      await deleteMutation.mutateAsync(id);
      showAlertMessage('success', `Kurumsal paket "${name}" başarıyla silindi.`);
    } catch (error: any) {
      showAlertMessage('error', error.message || 'Kurumsal paket silinirken hata oluştu.');
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
    <div className="space-y-6">
      <PageHeader
        title="Kurumsal İlan Paketleri"
        description="Kurumsal kullanıcılar için ilan paketlerini oluşturun ve yönetin"
      />

      {/* Alert Messages */}
      {showAlert && (
        <div className={`border rounded-lg p-4 ${
          showAlert.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          showAlert.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center">
            {showAlert.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
            {showAlert.type === 'error' && <AlertTriangle className="w-5 h-5 mr-2" />}
            {showAlert.type === 'info' && <Info className="w-5 h-5 mr-2" />}
            <span className="text-sm font-medium">{showAlert.message}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Paket ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#EC7830] focus:border-[#EC7830] sm:text-sm"
          />
        </div>
        
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#EC7830] hover:bg-[#d6691a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#EC7830]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Kurumsal Paket
        </button>
      </div>

      {/* Packages List */}
      {filteredPackages.length === 0 && !searchTerm ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz kurumsal paket yok</h3>
          <p className="text-gray-500 mb-6">İlk kurumsal paketinizi oluşturmaya başlayın.</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#EC7830] hover:bg-[#d6691a]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Kurumsal Paket
          </button>
        </div>
      ) : filteredPackages.length === 0 && searchTerm ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Arama sonucu bulunamadı</h3>
          <p className="text-gray-500">"{searchTerm}" için sonuç bulunamadı.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <ul id="hs-package-sortable" className="divide-y divide-gray-200">
            {filteredPackages.map((pkg, index) => {
              const features = JSON.parse(pkg.features || "[]");
              
              return (
                <li key={pkg.id} className="group hover:bg-gray-50 transition-colors duration-150">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="drag-handle cursor-move">
                          <GripVertical className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {pkg.name}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Kurumsal
                            </span>
                            {!pkg.isActive && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Pasif
                              </span>
                            )}
                          </div>
                          
                          {pkg.description && (
                            <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                          )}
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <span>Fiyat: <span className="font-medium text-gray-900">{Math.floor(pkg.basePrice / 100)} TL</span></span>
                            <span>Süre: <span className="font-medium text-gray-900">{pkg.durationDays} gün</span></span>
                            <span>Max Fotoğraf: <span className="font-medium text-gray-900">{pkg.maxPhotos}</span></span>
                          </div>
                          
                          {features.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {features.slice(0, 3).map((feature: string, idx: number) => (
                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                  {feature}
                                </span>
                              ))}
                              {features.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                  +{features.length - 3} daha
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditForm(pkg)}
                          className="inline-flex items-center p-2 text-gray-400 hover:text-[#EC7830] hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pkg.id, pkg.name)}
                          className="inline-flex items-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Package Form Modal */}
      <ListingPackageForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={editingPackage ? handleUpdate : handleCreate}
        listingPackage={editingPackage}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}