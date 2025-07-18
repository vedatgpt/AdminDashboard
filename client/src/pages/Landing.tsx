import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import logoPath from "@assets/logo_1752808818099.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={logoPath} 
              alt="Logo" 
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-xl font-bold text-gray-900">İlan Sitesi</h1>
          </div>
          <Link href="/login">
            <Button>Giriş Yap</Button>
          </Link>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Profesyonel İlan Platformu
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Bireysel ve kurumsal kullanıcılar için güvenli ve kullanıcı dostu ilan platformu. 
            Aradığınız her şeyi bulun veya satın.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Giriş Yap
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Kayıt Ol
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-primary rounded" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Güvenli İşlemler</h3>
            <p className="text-gray-600">Güvenli ödeme sistemi ve doğrulanmış kullanıcılar</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-primary rounded" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Kolay Kullanım</h3>
            <p className="text-gray-600">Sade ve anlaşılır arayüz ile hızlı ilan verme</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-primary rounded" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Geniş Ağ</h3>
            <p className="text-gray-600">Türkiye genelinde geniş kullanıcı ağı</p>
          </div>
        </div>
      </main>
    </div>
  );
}