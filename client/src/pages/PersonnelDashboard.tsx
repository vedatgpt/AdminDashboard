import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User, Building2, Mail, Phone, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function PersonnelDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Çıkış işlemi başarısız");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Başarıyla çıkış yapıldınız",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/login");
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
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

  if (!user || user.role !== "authorized_personnel") {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Yetkili Personel Paneli</h1>
          <p className="text-gray-600 mt-2">
            Hoş geldiniz, {user.firstName} {user.lastName}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Kişisel Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Ad Soyad:</span>
                <span>{user.firstName} {user.lastName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="font-medium">E-posta:</span>
                <span>{user.email}</span>
              </div>
              {user.mobilePhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Cep Telefonu:</span>
                  <span>{user.mobilePhone}</span>
                </div>
              )}
              {user.whatsappNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">WhatsApp:</span>
                  <span>{user.whatsappNumber}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Şirket Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Şirket:</span>
                <span>{user.companyName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Rol:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Yetkili Personel
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Hoş Geldiniz</CardTitle>
            <CardDescription>
              {user.companyName} şirketinin yetkili personeli olarak sisteme giriş yaptınız.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-700">
                Bu panele şirketinizin ana hesap sahibi tarafından eklendiniz. 
                Şirketiniz adına yapabileceğiniz işlemler için sistem yöneticinize danışabilirsiniz.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <h3 className="font-medium mb-2">Mevcut Yetkileriniz:</h3>
                <ul className="space-y-1 ml-4">
                  <li>• Hesap bilgilerinizi görüntüleme</li>
                  <li>• Şirket bilgilerine erişim</li>
                  <li>• (İlave yetkiler sistem yöneticisi tarafından tanımlanacaktır)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {logoutMutation.isPending ? "Çıkış yapılıyor..." : "Çıkış Yap"}
          </Button>
        </div>
      </div>
    </div>
  );
}