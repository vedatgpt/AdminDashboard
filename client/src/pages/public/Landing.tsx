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
          
        </div>
        
        
      </main>
    </div>
  );
}