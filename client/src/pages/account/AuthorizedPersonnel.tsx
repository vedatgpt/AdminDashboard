import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    toggleStatus,
    deletePersonnel,
    isCreating,
    isUpdating,
    isTogglingStatus,
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

  const handleToggleStatus = async (id: number) => {
    try {
      await toggleStatus(id);
    } catch (error) {
      // Error handling is done in the list component
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">Yetkili Kişiler</CardTitle>
                <CardDescription>
                  Şirketiniz adına sistem kullanabilecek yetkili kişileri yönetin
                </CardDescription>
              </div>
              <Button 
                onClick={handleAddPersonnel}
                className="bg-[#EC7830] hover:bg-[#EC7830]/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yetkili Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AuthorizedPersonnelList
              personnel={personnel}
              isLoading={isLoading}
              onEdit={handleEditPersonnel}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeletePersonnel}
              isTogglingStatus={isTogglingStatus}
              isDeleting={isDeleting}
            />
          </CardContent>
        </Card>

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