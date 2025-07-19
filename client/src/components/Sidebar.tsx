import { Link, useLocation } from "wouter";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Users, Megaphone, Tags, MapPin, X, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/logo_1752808818099.png";

const navigation = [
  { name: "Kullanıcılar", href: "/admin/users", icon: Users },
  { name: "İlanlar", href: "/admin/listings", icon: Megaphone },
  { name: "Kategoriler", href: "/admin/categories", icon: Tags },
  { name: "Lokasyonlar", href: "/admin/locations", icon: MapPin },
];

export default function Sidebar() {
  const { isOpen, close } = useSidebar();
  const [location, navigate] = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
      toast({
        title: "Başarılı",
        description: "Başarıyla çıkış yapıldı",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Çıkış işlemi başarısız",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={close}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <img 
              src={logoPath} 
              alt="Logo" 
              className="w-32 h-32 object-contain"
            />
          </div>
          <button
            onClick={close}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-8 flex flex-col h-full">
          <ul className="space-y-2 px-3 flex-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (location === "/" && item.href === "/admin/users");

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                      isActive
                        ? "bg-primary-light text-primary"
                        : "text-gray-700 hover:bg-primary-light hover:text-primary"
                    )}
                    onClick={close}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
          
          <div className="px-3 pb-6 space-y-2">
            <Link
              href="/settings"
              className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-gray-700 hover:bg-gray-100"
              onClick={close}
            >
              <Settings className="w-5 h-5 mr-3" />
              Ayarlar
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-gray-700 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Çıkış Yap
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
