import { Link, useLocation } from "wouter";
import { Home, Users, Megaphone, Tags, MapPin, LogOut, X, ChevronDown, ChevronUp } from "lucide-react";
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

export default function Sidebar() {
  const { isOpen, close } = useSidebar();
  const [location, navigate] = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Initialize Preline UI components on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).HSAccordion) {
      (window as any).HSAccordion.autoInit();
    }
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-[9998] bg-black bg-opacity-50 lg:hidden ${isOpen ? "block" : "hidden"}`}
        onClick={close}
      />



      {/* Preline UI Sidebar */}
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

          {/* Body */}
          <nav className="h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300">
            <div className="hs-accordion-group pb-0 px-2 w-full flex flex-col flex-wrap" data-hs-accordion-always-open>
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
                        className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg transition-colors duration-200 ${
                          isActive
                            ? "bg-gray-100 text-gray-800"
                            : "text-gray-800 hover:bg-gray-100"
                        }`}
                        onClick={close}
                      >
                        <Icon className="size-4" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}

                {/* Account Section with Accordion */}
                <li className="hs-accordion" id="account-accordion">
                  <button 
                    type="button" 
                    className="hs-accordion-toggle w-full text-start flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                    aria-expanded="false" 
                    aria-controls="account-accordion-collapse"
                  >
                    <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="15" r="3"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M10 15H6a4 4 0 0 0-4 4v2"/>
                      <path d="m21.7 16.4-.9-.3"/>
                      <path d="m15.2 13.9-.9-.3"/>
                      <path d="m16.6 18.7.3-.9"/>
                      <path d="m19.1 12.2.3-.9"/>
                      <path d="m19.6 18.7-.4-1"/>
                      <path d="m16.8 12.3-.4-1"/>
                      <path d="m14.3 16.6-.4-1"/>
                      <path d="m20.7 13.8-.9-.3"/>
                    </svg>
                    Hesap

                    <ChevronUp className="hs-accordion-active:block ms-auto hidden size-4 text-gray-600" />
                    <ChevronDown className="hs-accordion-active:hidden ms-auto block size-4 text-gray-600" />
                  </button>

                  <div 
                    id="account-accordion-collapse" 
                    className="hs-accordion-content w-full overflow-hidden transition-[height] duration-300 hidden" 
                    role="region" 
                    aria-labelledby="account-accordion"
                  >
                    <ul className="pt-1 ps-7 space-y-1">
                      <li>
                        <Link
                          href="/account"
                          className="flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                          onClick={close}
                        >
                          Profil
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/account/change-password"
                          className="flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                          onClick={close}
                        >
                          Şifre Değiştir
                        </Link>
                      </li>
                    </ul>
                  </div>
                </li>

                {/* Logout */}
                <li className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-red-600 rounded-lg hover:bg-red-50 focus:outline-none focus:bg-red-50 transition-colors duration-200"
                  >
                    <LogOut className="size-4" />
                    Çıkış Yap
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}