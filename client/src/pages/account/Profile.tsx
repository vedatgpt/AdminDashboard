import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const profileSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalı"),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalı"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  companyName: z.string().optional(),
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalı").optional(),
});

type ProfileData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      companyName: user?.companyName || "",
      username: user?.username || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileData) => 
      apiRequest("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Profil bilgileriniz güncellendi",
      });
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Profil güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = (data: ProfileData) => {
    updateProfileMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Yetkisiz Erişim</h1>
          <p className="text-gray-500 mt-2">Bu sayfaya erişim için giriş yapmanız gerekiyor.</p>
        </div>
      </div>
    );
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

              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  {...profileForm.register("email")}
                  placeholder="E-posta adresiniz"
                />
                {profileForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
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