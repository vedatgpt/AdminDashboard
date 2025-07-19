import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
      toast({
        title: "Başarılı",
        description: "Yetkili kişi silindi",
      });
      setDeleteDialogOpen(false);
      setSelectedPersonnelId(null);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Silme işlemi başarısız",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (id: number) => {
    setSelectedPersonnelId(id);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (personnel.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Henüz yetkili kişi eklenmemiş"
        description="Şirketiniz için yetkili kişiler ekleyerek onların da sistemi kullanmasını sağlayabilirsiniz."
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {personnel.map((person) => (
          <Card key={person.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-lg">
                      {person.firstName} {person.lastName}
                    </h3>
                    <Badge variant={person.isActive ? "default" : "secondary"}>
                      {person.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>E-posta: {person.email}</p>
                    {person.mobilePhone && <p>Cep: {person.mobilePhone}</p>}
                    {person.whatsappNumber && <p>WhatsApp: {person.whatsappNumber}</p>}
                    <p className="text-xs text-gray-500">
                      Eklenme: {new Date(person.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(person)}
                    title="Düzenle"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteClick(person.id)}
                    disabled={isDeleting}
                    title="Sil"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yetkili Kişiyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu yetkili kişiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}