import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Save, User, Upload, X, Camera } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const profileSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalı"),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalı"),
  companyName: z.string().optional(),
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalı").optional(),
});

type ProfileData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, refreshUser, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(user?.profileImage || null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      companyName: user?.companyName || "",
      username: user?.username || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Profil güncellenirken hata oluştu");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Başarılı",
        description: "Profil bilgileriniz güncellendi",
      });
      // Update form with new data
      profileForm.reset({
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName || "",
        username: data.username,
      });
      // Update the cached user data immediately
      queryClient.setQueryData(["/api/auth/me"], data);
      // Force a refetch to ensure sync
      queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Profil güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profileImage", file);
      
      const response = await fetch("/api/user/profile-image", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Profil resmi yüklenirken hata oluştu");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Başarılı",
        description: "Profil resminiz güncellendi",
      });
      setProfileImagePreview(data.profileImage);
      // Update the cached user data immediately
      queryClient.setQueryData(["/api/auth/me"], data);
      // Force a refetch to ensure sync
      queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Profil resmi yüklenirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  const deleteProfileImageMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/user/profile-image", {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Profil resmi silinirken hata oluştu");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Profil resminiz silindi",
      });
      setProfileImagePreview(null);
      // Update the cached user data immediately
      const currentUser = queryClient.getQueryData(["/api/auth/me"]) as any;
      if (currentUser) {
        queryClient.setQueryData(["/api/auth/me"], { ...currentUser, profileImage: null });
      }
      // Force a refetch to ensure sync
      queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Profil resmi silinirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = (data: ProfileData) => {
    updateProfileMutation.mutate(data);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File size check (5MB = 5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Hata",
        description: "Dosya boyutu 5MB'dan küçük olmalıdır",
        variant: "destructive",
      });
      return;
    }

    // File type check
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      toast({
        title: "Hata",
        description: "Sadece JPG ve PNG dosyaları desteklenmektedir",
        variant: "destructive",
      });
      return;
    }

    uploadProfileImageMutation.mutate(file);
  };

  const handleImageDelete = () => {
    deleteProfileImageMutation.mutate();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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

  if (!user) {
    return null; // Will redirect to login via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hesap Bilgilerim</h1>
          <p className="text-gray-600 mt-2">Profil bilgilerinizi güncelleyin</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Kişisel Bilgiler
            </CardTitle>
            <CardDescription>
              Hesap bilgilerinizi buradan düzenleyebilirsiniz
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.role === "corporate" && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {profileImagePreview ? (
                      <img
                        src={profileImagePreview}
                        alt="Profil resmi"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={triggerFileInput}
                        disabled={uploadProfileImageMutation.isPending}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {profileImagePreview ? "Değiştir" : "Yükle"}
                      </Button>
                      
                      {profileImagePreview && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleImageDelete}
                          disabled={deleteProfileImageMutation.isPending}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Sil
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      Maksimum 5MB, JPG/PNG formatları desteklenir
                    </p>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            )}
            
            <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
              {user.role === "corporate" && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Firma Adı</Label>
                  <Input
                    id="companyName"
                    {...profileForm.register("companyName")}
                    placeholder="Firma adınız"
                  />
                  {profileForm.formState.errors.companyName && (
                    <p className="text-sm text-red-500">
                      {profileForm.formState.errors.companyName.message}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ad</Label>
                  <Input
                    id="firstName"
                    {...profileForm.register("firstName")}
                    placeholder="Adınız"
                  />
                  {profileForm.formState.errors.firstName && (
                    <p className="text-sm text-red-500">
                      {profileForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Soyad</Label>
                  <Input
                    id="lastName"
                    {...profileForm.register("lastName")}
                    placeholder="Soyadınız"
                  />
                  {profileForm.formState.errors.lastName && (
                    <p className="text-sm text-red-500">
                      {profileForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>



              {user.role === "corporate" && (
                <div className="space-y-2">
                  <Label htmlFor="username">Kullanıcı Adı</Label>
                  <Input
                    id="username"
                    {...profileForm.register("username")}
                    placeholder="Kullanıcı adınız"
                  />
                  <p className="text-sm text-gray-500">
                    Kullanıcı adınız profil URL'nizde kullanılacaktır: /{profileForm.watch("username") || user.username}
                  </p>
                  {profileForm.formState.errors.username && (
                    <p className="text-sm text-red-500">
                      {profileForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
              )}



              <Button 
                type="submit" 
                className="w-full"
                disabled={updateProfileMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateProfileMutation.isPending ? "Güncelleniyor..." : "Profili Güncelle"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}