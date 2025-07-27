import { useState } from "react";
import { Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { useListingPackages, useCreateListingPackage, useUpdateListingPackage, useDeleteListingPackage, useReorderListingPackages } from "@/hooks/useListingPackages";
import ListingPackageForm from "@/components/ListingPackageForm";
import EmptyState from "@/components/EmptyState";
import type { ListingPackage } from "@shared/schema";

export default function CorporateListingPackages() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ListingPackage | null>(null);

  const { data: packages = [], isLoading } = useListingPackages();
  const createMutation = useCreateListingPackage();
  const updateMutation = useUpdateListingPackage();
  const deleteMutation = useDeleteListingPackage();
  const reorderMutation = useReorderListingPackages();

  // Filter only corporate packages
  const corporatePackages = (packages as ListingPackage[]).filter((pkg: ListingPackage) => {
    // For now, we'll assume no existing packages are corporate
    // TODO: Add package type field to distinguish
    return false;
  });

  const handleCreate = async (data: any) => {
    try {
      // Ensure this is marked as corporate package
      const packageData = {
        ...data,
        selectedMembershipTypes: ['corporate']
      };
      
      await createMutation.mutateAsync(packageData);
      setIsFormOpen(false);
      alert('Kurumsal paket başarıyla oluşturuldu!');
    } catch (error: any) {
      alert('Hata: ' + error.message);
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
      alert('Kurumsal paket başarıyla güncellendi!');
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu kurumsal paketi silmek istediğinizden emin misiniz?')) return;
    
    try {
      await deleteMutation.mutateAsync(id);
      alert('Kurumsal paket başarıyla silindi!');
    } catch (error: any) {
      alert('Hata: ' + error.message);
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kurumsal İlan Paketleri</h1>
          <p className="text-gray-600 mt-1">Kurumsal kullanıcılar için ilan paketlerini yönetin</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-[#EC7830] text-white rounded-lg hover:bg-[#d6691a] transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Kurumsal Paket
        </button>
      </div>

      {/* Packages List */}
      {corporatePackages.length === 0 ? (
        <EmptyState
          title="Henüz bir kurumsal paket yok"
          description="İlk kurumsal paketinizi oluşturmak için 'Yeni Kurumsal Paket' butonuna tıklayın."
        />
      ) : (
        <div className="grid gap-4">
          {corporatePackages.map((pkg: ListingPackage) => (
            <div
              key={pkg.id}
              className="group bg-white rounded-lg border border-gray-200 p-6 hover:border-[#EC7830] hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                    <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
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
                    <p className="text-gray-600 mb-3">{pkg.description}</p>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span>Fiyat: <strong>{Math.floor(pkg.basePrice / 100)} TL</strong></span>
                    <span>Süre: <strong>{pkg.durationDays} gün</strong></span>
                    <span>Max Fotoğraf: <strong>{pkg.maxPhotos}</strong></span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditForm(pkg)}
                    className="inline-flex items-center p-2 text-gray-400 hover:text-[#EC7830] hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="inline-flex items-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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