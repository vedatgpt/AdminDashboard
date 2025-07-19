import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthorizedPersonnel } from "@/hooks/useAuthorizedPersonnel";
import AuthorizedPersonnelForm from "@/components/AuthorizedPersonnelForm";
import AuthorizedPersonnelList from "@/components/AuthorizedPersonnelList";
import type { AuthorizedPersonnel as PersonnelType } from "@shared/schema";

export default function AuthorizedPersonnel() {
  const { user } = useAuth();
  const {
    personnel,
    isLoading,
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
    isCreating,
    isUpdating,
    isDeleting,
  } = useAuthorizedPersonnel();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<PersonnelType | undefined>(undefined);

  // Only corporate users can access this page
  if (user?.role !== "corporate") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Erişim Reddedildi</h1>
          <p className="text-gray-600">Bu sayfaya sadece kurumsal hesaplar erişebilir.</p>
        </div>
      </div>
    );
  }

  const handleAddPersonnel = () => {
    setEditingPersonnel(undefined);
    setIsFormOpen(true);
  };

  const handleEditPersonnel = (personnel: PersonnelType) => {
    setEditingPersonnel(personnel);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPersonnel(undefined);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingPersonnel) {
        await updatePersonnel({ id: editingPersonnel.id, data });
      } else {
        await createPersonnel(data);
      }
    } catch (error) {
      // Error handling is done in the form component
      throw error;
    }
  };

  const handleDeletePersonnel = async (id: number) => {
    try {
      await deletePersonnel(id);
    } catch (error) {
      // Error handling is done in the list component
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Yetkili Kişiler</h1>
                <p className="text-gray-600 mt-1">
                  Şirketiniz adına sistem kullanabilecek yetkili kişileri yönetin
                </p>
              </div>
              <button 
                onClick={handleAddPersonnel}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yetkili Ekle
              </button>
            </div>
          </div>
          <div className="p-6">
            <AuthorizedPersonnelList
              personnel={personnel}
              isLoading={isLoading}
              onEdit={handleEditPersonnel}
              onDelete={handleDeletePersonnel}
              isDeleting={isDeleting}
            />
          </div>
        </div>

        <AuthorizedPersonnelForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          personnel={editingPersonnel}
          isSubmitting={editingPersonnel ? isUpdating : isCreating}
          title={editingPersonnel ? "Yetkili Kişiyi Güncelle" : "Yeni Yetkili Kişi Ekle"}
        />
      </div>
    </div>
  );
}