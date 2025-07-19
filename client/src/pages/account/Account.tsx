import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { User, Key, ChevronRight, Mail, LogOut, Phone, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Account() {
  const { user, logout, isLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Başarılı",
        description: "Başarıyla çıkış yapıldı",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Hata",
        description: "Çıkış yaparken bir hata oluştu",
        variant: "destructive",
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

  if (!user) {
    return null; // Will redirect to login via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hesap Yönetimi</h1>
          <p className="text-gray-600 mt-2">Hesap ayarlarınızı yönetin</p>
        </div>

        <div className="flex flex-col gap-4">
          <Link href="/account/profile">
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Hesap Bilgilerim</h3>
                      <p className="text-gray-600 text-sm">Ad, soyad, e-posta ve diğer kişisel bilgilerinizi düzenleyin</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/account/contact">
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg cursor-pointer">
              <div className="pb-3">
                <h3 className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    İletişim Bilgilerim
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </h3>
                <p>
                  Telefon numaralarınızı güncelleyin
                </p>
              </div>
            </div>
          </Link>

          <Link href="/account/change-email">
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg cursor-pointer">
              <div className="pb-3">
                <h3 className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    E-posta Değişikliği
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </h3>
                <p>
                  E-posta adresinizi güncelleyin
                </p>
              </div>
            </div>
          </Link>

          <Link href="/account/change-password">
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg cursor-pointer">
              <div className="pb-3">
                <h3 className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-primary" />
                    Şifre Değişikliği
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </h3>
                <p>
                  Hesap güvenliğiniz için şifrenizi güncelleyin
                </p>
              </div>
            </div>
          </Link>

          {user.role === "corporate" && (
            <Link href="/account/authorized-personnel">
              <div className="bg-white rounded-lg border border-gray-200 shadow-lg cursor-pointer">
                <div className="pb-3">
                  <h3 className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-primary" />
                      Yetkili Kişiler
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </h3>
                  <p>
                    Şirketiniz adına işlem yapacak yetkili kişileri yönetin
                  </p>
                </div>
              </div>
            </Link>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}