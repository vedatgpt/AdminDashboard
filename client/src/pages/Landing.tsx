import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
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

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={logoPath} 
              alt="Logo" 
              className="w-36 h-10 object-contain"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <span className="text-gray-700 font-medium">
                  {getUserDisplayName()}
                </span>
                <Link href="/settings">
                  <Button variant="outline">Ayarlar</Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                >
                  Çıkış Yap
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button>Giriş Yap</Button>
              </Link>
            )}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            İlan Platformu
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Bireysel ve kurumsal kullanıcılar için güvenli ve kullanıcı dostu ilan platformu. 
            Aradığınız her şeyi bulun veya satın.
          </p>
          
        </div>
        
        
      </main>
    </div>
  );
}