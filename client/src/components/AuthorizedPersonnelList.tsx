import { Edit, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { AuthorizedPersonnel } from "@shared/schema";
import EmptyState from "@/components/EmptyState";

interface AuthorizedPersonnelListProps {
  personnel: AuthorizedPersonnel[];
  isLoading: boolean;
  onEdit: (personnel: AuthorizedPersonnel) => void;
  onDelete: (id: number) => Promise<void>;
  isDeleting: boolean;
}

export default function AuthorizedPersonnelList({
  personnel,
  isLoading,
  onEdit,
  onDelete,
  isDeleting
}: AuthorizedPersonnelListProps) {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<number | null>(null);

  const handleDeleteConfirm = async () => {
    if (!selectedPersonnelId) return;

    try {
      await onDelete(selectedPersonnelId);
      setDeleteDialogOpen(false);
      setSelectedPersonnelId(null);
      toast({
        title: "Başarılı",
        description: "Yetkili kişi silindi",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Silme işlemi başarısız",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedPersonnelId(null);
  };

  const handleDeleteClick = (id: number) => {
    setSelectedPersonnelId(id);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Yetkili Kişiler
          </h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Yükleniyor...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!personnel.length) {
    return (
      <EmptyState
        icon={Users}
        title="Yetkili kişi bulunamadı"
        description="Henüz hiç yetkili kişi eklenmemiş. İlk yetkili kişinizi eklemek için 'Yeni Yetkili Kişi Ekle' butonunu kullanın."
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {personnel.map((person) => (
          <div key={person.id} className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {person.firstName} {person.lastName}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      person.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {person.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">E-posta:</span> {person.email}
                    </p>
                    {person.mobilePhone && (
                      <p>
                        <span className="font-medium">Cep Telefonu:</span> {person.mobilePhone}
                      </p>
                    )}
                    {person.whatsappNumber && (
                      <p>
                        <span className="font-medium">WhatsApp:</span> {person.whatsappNumber}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(person)}
                    title="Düzenle"
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteClick(person.id)}
                    disabled={isDeleting}
                    title="Sil"
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Yetkili kişiyi sil
              </h3>
              <p className="text-gray-600 mb-6">
                Bu yetkili kişiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  İptal
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}