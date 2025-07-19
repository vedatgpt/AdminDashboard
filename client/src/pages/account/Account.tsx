import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

        <div className="space-y-4">
          <Link href="/account/profile">
            <Card className="cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    Hesap Bilgilerim
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </CardTitle>
                <CardDescription>
                  Ad, soyad, e-posta ve diğer kişisel bilgilerinizi düzenleyin
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/account/contact">
            <Card className="cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    İletişim Bilgilerim
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </CardTitle>
                <CardDescription>
                  Telefon numaralarınızı güncelleyin
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/account/change-email">
            <Card className="cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    E-posta Değişikliği
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </CardTitle>
                <CardDescription>
                  E-posta adresinizi güncelleyin
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/account/change-password">
            <Card className="cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-primary" />
                    Şifre Değişikliği
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </CardTitle>
                <CardDescription>
                  Hesap güvenliğiniz için şifrenizi güncelleyin
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {user.role === "corporate" && (
            <Link href="/account/authorized-personnel">
              <Card className="cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-primary" />
                      Yetkili Kişiler
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </CardTitle>
                  <CardDescription>
                    Şirketiniz adına işlem yapacak yetkili kişileri yönetin
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}
        </div>

        <div className="mt-6">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Çıkış Yap
          </Button>
        </div>

        
      </div>
    </div>
  );
}