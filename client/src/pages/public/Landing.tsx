import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import ModernNavbar from "@/components/Navbar";
import logoPath from "@assets/logo_1752808818099.png";

export default function Landing() {
  const { isAuthenticated, user, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getUserDisplayName = () => {
    if (!user) return "";
    
    if (user.role === "corporate" && user.companyName) {
      return user.companyName;
    }
    
    return `${user.firstName} ${user.lastName}`;
  };

  const handleSearch = (searchTerm: string) => {
    console.log('Landing sayfasında arama:', searchTerm);
    // Burada arama fonksiyonunu implement edebilirsiniz
  };

  return (
    <div className="min-h-screen bg-white">
      <ModernNavbar onSearch={handleSearch} />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            İlan Platformu
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Bireysel ve kurumsal kullanıcılar için güvenli ve kullanıcı dostu ilan platformu. 
            Aradığınız her şeyi bulun veya satın.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/post-ad">
              <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                İlan Ver
              </button>
            </Link>
            
            {!isAuthenticated && (
              <>
                <Link href="/login">
                  <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-8 rounded-lg transition-colors">
                    Giriş Yap
                  </button>
                </Link>
                <Link href="/register">
                  <button className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                    Kayıt Ol
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Categories Preview Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Popüler Kategoriler
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Placeholder category cards - will be populated with real data later */}
            <div className="bg-gray-100 p-4 rounded-lg text-center hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="text-2xl mb-2">🚗</div>
              <div className="text-sm font-medium">Vasıta</div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="text-2xl mb-2">🏠</div>
              <div className="text-sm font-medium">Emlak</div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="text-2xl mb-2">📱</div>
              <div className="text-sm font-medium">Teknoloji</div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="text-2xl mb-2">👕</div>
              <div className="text-sm font-medium">Giyim</div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="text-2xl mb-2">🛋️</div>
              <div className="text-sm font-medium">Ev & Yaşam</div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="text-2xl mb-2">⚽</div>
              <div className="text-sm font-medium">Spor</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}