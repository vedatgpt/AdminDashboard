import { useLocation } from "wouter";
import { useSidebar } from "@/hooks/use-sidebar";
import { Menu, Bell, User } from "lucide-react";

const pageConfigs = {
  "/users": { title: "Kullanıcılar", subtitle: "Sistem kullanıcılarını yönetin" },
  "/ads": { title: "İlanlar", subtitle: "Yayınlanan ilanları yönetin" },
  "/categories": { title: "Kategoriler", subtitle: "İlan kategorilerini yönetin" },
  "/locations": { title: "Lokasyonlar", subtitle: "Şehir ve ilçeleri yönetin" },
  "/": { title: "Kullanıcılar", subtitle: "Sistem kullanıcılarını yönetin" },
};

export default function Header() {
  const { toggle } = useSidebar();
  const [location] = useLocation();
  const config = pageConfigs[location as keyof typeof pageConfigs] || pageConfigs["/"];

  return (
    <div className="sticky top-0 z-40 lg:mx-auto lg:px-8">
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white lg:px-0">
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
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
