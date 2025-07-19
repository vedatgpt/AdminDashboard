import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Save, User, Upload, X, Camera } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
// import { useToast } from "@/hooks/use-toast";
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
  // const { toast } = useToast();
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
      alert("Profil bilgileriniz başarıyla güncellendi");
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
      alert(error.message || "Profil güncellenirken bir hata oluştu");
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
      alert("Profil resminiz başarıyla güncellendi");
      setProfileImagePreview(data.profileImage);
      // Update the cached user data immediately
      queryClient.setQueryData(["/api/auth/me"], data);
      // Force a refetch to ensure sync
      queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      alert(error.message || "Profil resmi yüklenirken hata oluştu");
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
      alert("Profil resminiz başarıyla silindi");
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
      alert(error.message || "Profil resmi silinirken hata oluştu");
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
      alert("Dosya boyutu 5MB'dan küçük olmalıdır");
      return;
    }

    // File type check
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      alert("Sadece JPG ve PNG dosyaları desteklenmektedir");
      return;
    }

    uploadProfileImageMutation.mutate(file);
  };

  const handleImageDelete = () => {
    deleteProfileImageMutation.mutate();
  };

  const triggerFileinput = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-60 flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70">
        <div className="flex flex-auto flex-col justify-center items-center p-4 md:p-5">
          <div className="flex justify-center">
            <div className="animate-spin inline-block size-6 border-3 border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500" role="status" aria-label="loading">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
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

        <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
          <div>
            <h3 className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Kişisel Bilgiler
            </h3>
            <p>
              Hesap bilgilerinizi buradan düzenleyebilirsiniz
            </p>
          </div>
          <div className="p-6">
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
                      <button
                        type="button"
                        onClick={triggerFileinput}
                        disabled={uploadProfileImageMutation.isPending}
                        className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {profileImagePreview ? "Değiştir" : "Yükle"}
                      </button>
                      
                      {profileImagePreview && (
                        <button
                          type="button"
                          onClick={handleImageDelete}
                          disabled={deleteProfileImageMutation.isPending}
                          className="flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Sil
                        </button>
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
                  <label htmlFor="companyName">Firma Adı</label>
                  <input
                    id="companyName"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Firma adınız"
                    {...profileForm.register("companyName")}
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
                  <label htmlFor="firstName">Ad</label>
                  <input
                    id="firstName"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Adınız"
                    {...profileForm.register("firstName")}
                  />
                  {profileForm.formState.errors.firstName && (
                    <p className="text-sm text-red-500">
                      {profileForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="lastName">Soyad</label>
                  <input
                    id="lastName"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Soyadınız"
                    {...profileForm.register("lastName")}
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
                  <label htmlFor="username">Kullanıcı Adı</label>
                  <input
                    id="username"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Kullanıcı adınız"
                    {...profileForm.register("username")}
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



              <button 
                type="submit" 
                className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d6691a] focus:outline-hidden focus:bg-[#d6691a] disabled:opacity-50 disabled:pointer-events-none"
                disabled={updateProfileMutation.isPending}
              >
                <Save className="w-4 h-4" />
                {updateProfileMutation.isPending ? "Güncelleniyor..." : "Profili Güncelle"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}