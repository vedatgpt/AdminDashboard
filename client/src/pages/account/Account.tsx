import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Key, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Account() {
  const { user } = useAuth();

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
          <h1 className="text-3xl font-bold text-gray-900">Hesap Yönetimi</h1>
          <p className="text-gray-600 mt-2">Hesap ayarlarınızı yönetin</p>
        </div>

        <div className="space-y-4">
          <Link href="/account/profile">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
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

          <Link href="/account/change-password">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
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
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Hesap Bilgileri</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Kullanıcı Adı:</strong> @{user.username}</p>
            <p><strong>E-posta:</strong> {user.email}</p>
            <p><strong>Hesap Türü:</strong> {
              user.role === "individual" ? "Bireysel" : 
              user.role === "corporate" ? "Kurumsal" :
              user.role === "admin" ? "Yönetici" : "Editör"
            }</p>
            {user.companyName && (
              <p><strong>Firma:</strong> {user.companyName}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}