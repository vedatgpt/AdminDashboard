import { useEffect } from "react";
import { useLocation } from "wouter";
import { User, Mail, Phone, MessageSquare, Building2, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

export default function PersonnelDashboard() {
  const { user, logout, isLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "authorized_personnel")) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await logout();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Başarıyla çıkış yapıldı",
      });
      navigate("/login");
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Çıkış yaparken bir hata oluştu",
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
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Kişisel Bilgiler
              </h3>
            </div>
            <div className="p-6 space-y-3">
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
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Şirket Bilgileri
              </h3>
            </div>
            <div className="p-6 space-y-3">
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
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-lg mt-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Hoş Geldiniz</h3>
            <p className="text-gray-600 mt-1">
              {user.companyName} şirketinin yetkili personeli olarak sisteme giriş yaptınız.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {logoutMutation.isPending ? "Çıkış yapılıyor..." : "Çıkış Yap"}
          </button>
        </div>
      </div>
    </div>
  );
}