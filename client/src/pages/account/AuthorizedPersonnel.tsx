import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

const personnelSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalı"),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalı"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  mobilePhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
});

type PersonnelData = z.infer<typeof personnelSchema>;

interface AuthorizedPersonnel {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  mobilePhone?: string;
  whatsappNumber?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AuthorizedPersonnel() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<AuthorizedPersonnel | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "corporate")) {
      navigate("/account");
    }
  }, [user, isLoading, navigate]);

  const personnelForm = useForm<PersonnelData>({
    resolver: zodResolver(personnelSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      mobilePhone: "",
      whatsappNumber: "",
    },
  });

  // Fetch authorized personnel
  const { data: personnelList, isLoading: isLoadingPersonnel } = useQuery({
    queryKey: ["/api/authorized-personnel"],
    enabled: !!user && user.role === "corporate",
  });

  // Add personnel mutation
  const addPersonnelMutation = useMutation({
    mutationFn: async (data: PersonnelData) => {
      const response = await fetch("/api/authorized-personnel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Yetkili eklenirken hata oluştu");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Yetkili kişi eklendi",
      });
      personnelForm.reset();
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/authorized-personnel"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update personnel mutation
  const updatePersonnelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PersonnelData> }) => {
      const response = await fetch(`/api/authorized-personnel/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Yetkili güncellenirken hata oluştu");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Yetkili kişi güncellendi",
      });
      setEditingPersonnel(null);
      queryClient.invalidateQueries({ queryKey: ["/api/authorized-personnel"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete personnel mutation
  const deletePersonnelMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/authorized-personnel/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Yetkili silinirken hata oluştu");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Yetkili kişi silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/authorized-personnel"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/authorized-personnel/${id}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Durum değiştirilirken hata oluştu");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Yetkili durumu güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/authorized-personnel"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddPersonnel = (data: PersonnelData) => {
    addPersonnelMutation.mutate(data);
  };

  const handleUpdatePersonnel = (data: PersonnelData) => {
    if (editingPersonnel) {
      updatePersonnelMutation.mutate({ 
        id: editingPersonnel.id, 
        data: { ...data, password: data.password || undefined }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-2">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "corporate") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yetkili Kişiler</h1>
            <p className="text-gray-600 mt-2">Şirketiniz adına işlem yapacak yetkili kişileri yönetin</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Yetkili Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Yeni Yetkili Kişi Ekle</DialogTitle>
                <DialogDescription>
                  Şirketiniz adına işlem yapacak yeni bir yetkili kişi ekleyin
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={personnelForm.handleSubmit(handleAddPersonnel)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Ad</Label>
                    <Input
                      id="firstName"
                      {...personnelForm.register("firstName")}
                      placeholder="Ad"
                    />
                    {personnelForm.formState.errors.firstName && (
                      <p className="text-sm text-red-500">
                        {personnelForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Soyad</Label>
                    <Input
                      id="lastName"
                      {...personnelForm.register("lastName")}
                      placeholder="Soyad"
                    />
                    {personnelForm.formState.errors.lastName && (
                      <p className="text-sm text-red-500">
                        {personnelForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    {...personnelForm.register("email")}
                    placeholder="ornek@email.com"
                  />
                  {personnelForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {personnelForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...personnelForm.register("password")}
                      placeholder="En az 6 karakter"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {personnelForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {personnelForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobilePhone">Cep Telefonu</Label>
                    <Input
                      id="mobilePhone"
                      type="tel"
                      {...personnelForm.register("mobilePhone")}
                      placeholder="0555 123 4567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber">WhatsApp</Label>
                    <Input
                      id="whatsappNumber"
                      type="tel"
                      {...personnelForm.register("whatsappNumber")}
                      placeholder="0555 123 4567"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex-1"
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={addPersonnelMutation.isPending}
                    className="flex-1"
                  >
                    {addPersonnelMutation.isPending ? "Ekleniyor..." : "Yetkili Ekle"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Yetkili Kişiler Listesi
            </CardTitle>
            <CardDescription>
              {personnelList?.length || 0} yetkili kişi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPersonnel ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-500 mt-2">Yükleniyor...</p>
              </div>
            ) : personnelList?.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz yetkili kişi yok</h3>
                <p className="text-gray-600 mb-4">Şirketiniz adına işlem yapacak yetkili kişiler ekleyin</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  İlk Yetkiliyi Ekle
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {personnelList?.map((personnel: AuthorizedPersonnel) => (
                  <div
                    key={personnel.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {personnel.firstName} {personnel.lastName}
                        </h3>
                        <Badge variant={personnel.isActive ? "default" : "secondary"}>
                          {personnel.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{personnel.email}</p>
                      <div className="flex gap-4 text-sm text-gray-500">
                        {personnel.mobilePhone && (
                          <span>Cep: {personnel.mobilePhone}</span>
                        )}
                        {personnel.whatsappNumber && (
                          <span>WhatsApp: {personnel.whatsappNumber}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActiveMutation.mutate({
                          id: personnel.id,
                          isActive: !personnel.isActive
                        })}
                        disabled={toggleActiveMutation.isPending}
                      >
                        {personnel.isActive ? "Pasif Yap" : "Aktif Yap"}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPersonnel(personnel);
                          personnelForm.reset({
                            firstName: personnel.firstName,
                            lastName: personnel.lastName,
                            email: personnel.email,
                            password: "",
                            mobilePhone: personnel.mobilePhone || "",
                            whatsappNumber: personnel.whatsappNumber || "",
                          });
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Yetkiliyi Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                              {personnel.firstName} {personnel.lastName} adlı yetkiliyi silmek istediğinizden emin misiniz? 
                              Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deletePersonnelMutation.mutate(personnel.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Personnel Dialog */}
        <Dialog open={!!editingPersonnel} onOpenChange={(open) => !open && setEditingPersonnel(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Yetkili Düzenle</DialogTitle>
              <DialogDescription>
                Yetkili kişi bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={personnelForm.handleSubmit(handleUpdatePersonnel)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">Ad</Label>
                  <Input
                    id="edit-firstName"
                    {...personnelForm.register("firstName")}
                    placeholder="Ad"
                  />
                  {personnelForm.formState.errors.firstName && (
                    <p className="text-sm text-red-500">
                      {personnelForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Soyad</Label>
                  <Input
                    id="edit-lastName"
                    {...personnelForm.register("lastName")}
                    placeholder="Soyad"
                  />
                  {personnelForm.formState.errors.lastName && (
                    <p className="text-sm text-red-500">
                      {personnelForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">E-posta</Label>
                <Input
                  id="edit-email"
                  type="email"
                  {...personnelForm.register("email")}
                  placeholder="ornek@email.com"
                />
                {personnelForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {personnelForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">Yeni Şifre (İsteğe bağlı)</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showPassword ? "text" : "password"}
                    {...personnelForm.register("password")}
                    placeholder="Değiştirmek için yeni şifre girin"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {personnelForm.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {personnelForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-mobilePhone">Cep Telefonu</Label>
                  <Input
                    id="edit-mobilePhone"
                    type="tel"
                    {...personnelForm.register("mobilePhone")}
                    placeholder="0555 123 4567"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-whatsappNumber">WhatsApp</Label>
                  <Input
                    id="edit-whatsappNumber"
                    type="tel"
                    {...personnelForm.register("whatsappNumber")}
                    placeholder="0555 123 4567"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingPersonnel(null)}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={updatePersonnelMutation.isPending}
                  className="flex-1"
                >
                  {updatePersonnelMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}