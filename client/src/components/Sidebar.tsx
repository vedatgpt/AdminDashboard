import { Link, useLocation } from "wouter";
import { useSidebar } from "@/hooks/use-sidebar";
import { Users, Megaphone, Tags, MapPin, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Kullanıcılar", href: "/users", icon: Users },
  { name: "İlanlar", href: "/ads", icon: Megaphone },
  { name: "Kategoriler", href: "/categories", icon: Tags },
  { name: "Lokasyonlar", href: "/locations", icon: MapPin },
];

export default function Sidebar() {
  const { isOpen, close } = useSidebar();
  const [location] = useLocation();

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
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <span className="ml-3 text-xl font-semibold text-gray-800">Admin Panel</span>
          </div>
          <button
            onClick={close}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="mt-8">
          <div className="px-6 mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Yönetim
            </h3>
          </div>
          
          <ul className="space-y-2 px-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (location === "/" && item.href === "/users");
              
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
        </nav>
      </div>
    </>
  );
}
