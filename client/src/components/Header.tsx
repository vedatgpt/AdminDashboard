import { useLocation } from "wouter";
import { useSidebar } from "@/hooks/use-sidebar";
import { Menu, Bell, User, Settings, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const pageConfigs = {
  "/users": { title: "Kullanıcılar", subtitle: "Sistem kullanıcılarını yönetin" },
  "/listings": { title: "İlanlar", subtitle: "Yayınlanan ilanları yönetin" },
  "/categories": { title: "Kategoriler", subtitle: "İlan kategorilerini yönetin" },
  "/locations": { title: "Lokasyonlar", subtitle: "Şehir ve ilçeleri yönetin" },
  "/": { title: "Kullanıcılar", subtitle: "Sistem kullanıcılarını yönetin" },
};

export default function Header() {
  const { toggle } = useSidebar();
  const [location] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const config = pageConfigs[location as keyof typeof pageConfigs] || pageConfigs["/"];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8 border-b border-gray-200 bg-white">
        <div className="flex items-center">
          <button
            onClick={toggle}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="ml-4 lg:ml-0">
            <h1 className="text-xl font-semibold text-gray-900">{config.title}</h1>
            <p className="text-sm text-gray-500">{config.subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary">
            <Bell className="w-5 h-5" />
          </button>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">Admin</span>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg z-50">
                <div className="py-1">
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    <Settings className="w-4 h-4 mr-3" />
                    Ayarlar
                  </button>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    <LogOut className="w-4 h-4 mr-3" />
                    Çıkış Yap
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
