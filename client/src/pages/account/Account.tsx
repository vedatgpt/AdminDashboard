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
            <div className="bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-[#EC7830]" />
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
            <div className="bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-[#EC7830]" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">İletişim Bilgilerim</h3>
                      <p className="text-gray-600 text-sm">Telefon numaralarınızı güncelleyin</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/account/change-email">
            <div className="bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#EC7830]" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">E-posta Değişikliği</h3>
                      <p className="text-gray-600 text-sm">E-posta adresinizi güncelleyin</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/account/change-password">
            <div className="bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-[#EC7830]" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Şifre Değişikliği</h3>
                      <p className="text-gray-600 text-sm">Hesap güvenliğiniz için şifrenizi güncelleyin</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </Link>

          {user.role === "corporate" && (
            <Link href="/account/authorized-personnel">
              <div className="bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-[#EC7830]" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Yetkili Kişiler</h3>
                        <p className="text-gray-600 text-sm">Şirketiniz adına işlem yapacak yetkili kişileri yönetin</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-red-300 bg-white text-red-600 hover:bg-red-50 focus:outline-hidden focus:bg-red-50 disabled:opacity-50 disabled:pointer-events-none"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}