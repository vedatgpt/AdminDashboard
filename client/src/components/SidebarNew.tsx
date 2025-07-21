import { Link, useLocation } from "wouter";
import { Home, Users, Megaphone, Tags, MapPin, LogOut, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/use-sidebar";
import logoPath from "@assets/logo_1752808818099.png";
import { useEffect } from "react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: Home },
  { name: "Kullanıcılar", href: "/admin/users", icon: Users },
  { name: "İlanlar", href: "/admin/listings", icon: Megaphone },
  { name: "Kategoriler", href: "/admin/categories", icon: Tags },
  { name: "Lokasyonlar", href: "/admin/locations", icon: MapPin },
];

export default function SidebarNew() {
  const { isOpen, close } = useSidebar();
  const [location, navigate] = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Initialize Preline UI components when sidebar opens
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initDropdown = () => {
        if ((window as any).HSDropdown) {
          (window as any).HSDropdown.autoInit();
        }
      };
      
      // Initialize immediately
      initDropdown();
      
      // Reinitialize when sidebar opens
      if (isOpen) {
        setTimeout(initDropdown, 50);
      }
    }
  }, [isOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-[9998] bg-black bg-opacity-50 lg:hidden ${isOpen ? "block" : "hidden"}`}
        onClick={close}
      />

      {/* Preline UI Sidebar with Header Profile */}
      <div 
        id="hs-sidebar-collapsible-group" 
        className={`hs-overlay [--auto-close:lg] lg:block lg:translate-x-0 lg:end-auto lg:bottom-0 w-64
        hs-overlay-open:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-all duration-300 transform
        h-full
        ${isOpen ? "block" : "hidden lg:block"}
        fixed top-0 start-0 bottom-0 z-[9999]
        bg-white border-e border-gray-200`}
        role="dialog" 
        tabIndex={-1} 
        aria-label="Sidebar"
      >
        <div className="relative flex flex-col h-full max-h-full">
          {/* Header */}
          <header className="p-4 flex justify-between items-center gap-x-2">
            <Link 
              href="/admin" 
              className="flex-none font-semibold text-xl text-black focus:outline-none focus:opacity-80"
              onClick={close}
            >
              <img 
                src={logoPath} 
                alt="Logo" 
                className="w-32 h-auto object-contain"
              />
            </Link>

            <div className="lg:hidden -me-2">
              <button 
                type="button" 
                className="flex justify-center items-center gap-x-3 size-6 bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 rounded-full focus:outline-none focus:bg-gray-100"
                onClick={close}
                data-hs-overlay="#hs-sidebar-collapsible-group"
              >
                <X className="shrink-0 size-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          </header>

          {/* Admin Profile Section - Top */}
          <div className="mt-auto p-2 border-y border-gray-200">
            <div className="hs-dropdown [--strategy:absolute] [--auto-close:inside] relative w-full inline-flex">
              <button 
                id="hs-sidebar-header-dropdown" 
                type="button" 
                className="hs-dropdown-toggle w-full inline-flex shrink-0 items-center gap-x-2 p-2 text-start text-sm text-gray-800 rounded-md hover:bg-gray-100 focus:outline-none focus:bg-gray-100" 
                aria-haspopup="menu" 
                aria-expanded="false" 
                aria-label="Admin Dropdown"
              >
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">A</span>
                </div>
                Admin
                <svg className="shrink-0 size-3.5 ms-auto" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m7 15 5 5 5-5"/>
                  <path d="m7 9 5-5 5 5"/>
                </svg>
              </button>

              <div className="hs-dropdown-menu hs-dropdown-open:opacity-100 w-60 transition-[opacity,margin] duration opacity-0 hidden z-20 bg-white border border-gray-200 rounded-lg shadow-lg" role="menu" aria-orientation="vertical" aria-labelledby="hs-sidebar-header-dropdown">
                <div className="p-1">
                  <Link
                    href="/account"
                    className="flex items-center gap-x-3 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                    onClick={close}
                  >
                    Hesabım
                  </Link>
                  <Link
                    href="/account/change-password"
                    className="flex items-center gap-x-3 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                    onClick={close}
                  >
                    Ayarlar
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-x-3 py-2 px-3 rounded-lg text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:bg-red-50"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <nav className="h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300">
            <div className="hs-accordion-group pb-0 px-2 pt-2 w-full flex flex-col flex-wrap" data-hs-accordion-always-open>
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href || 
                                   (location === "/" && item.href === "/admin") ||
                                   (item.href === "/admin/categories" && location.startsWith("/admin/categories")) ||
                                   (item.href === "/admin/locations" && location.startsWith("/admin/locations"));

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg focus:outline-none transition-colors duration-200 ${
                          isActive
                            ? "bg-gray-100 text-gray-800"
                            : "text-gray-800 hover:bg-gray-100 focus:bg-gray-100"
                        }`}
                        onClick={close}
                      >
                        <Icon className="size-4" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}