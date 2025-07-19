import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Key } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre gerekli"),
  newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalı"),
});

type PasswordData = z.infer<typeof passwordSchema>;

export default function PasswordChange() {
  const { user, refreshUser, isLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordData) => {
      const response = await fetch("/api/user/change-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Şifre değiştirilirken hata oluştu");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Şifreniz başarıyla değiştirildi",
      });
      passwordForm.reset();
      // Force user data refresh to ensure any session updates are reflected
      refreshUser();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Şifre değiştirilirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handlePasswordChange = (data: PasswordData) => {
    changePasswordMutation.mutate(data);
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
          <h1 className="text-3xl font-bold text-gray-900">Şifre Değişikliği</h1>
          <p className="text-gray-600 mt-2">Hesap güvenliğiniz için şifrenizi güncelleyin</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Yeni Şifre Belirle
            </CardTitle>
            <CardDescription>
              Güvenli bir şifre seçerek hesabınızı koruyun
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    {...passwordForm.register("currentPassword")}
                    placeholder="Mevcut şifrenizi giriniz"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-red-500">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Yeni Şifre</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    {...passwordForm.register("newPassword")}
                    placeholder="Yeni şifrenizi giriniz"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Şifreniz en az 6 karakter uzunluğunda olmalıdır
                </p>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-red-500">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={changePasswordMutation.isPending}
              >
                <Key className="w-4 h-4 mr-2" />
                {changePasswordMutation.isPending ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}