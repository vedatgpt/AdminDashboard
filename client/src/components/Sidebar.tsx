import { Link, useLocation } from "wouter";
import { useSidebar } from "@/hooks/use-sidebar";
import { Users, Megaphone, Tags, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import logoPath from "@assets/logo_1752808818099.png";

const navigation = [
  { name: "Kullanıcılar", href: "/admin/users", icon: Users },
  { name: "İlanlar", href: "/admin/listings", icon: Megaphone },
  { name: "Kategoriler", href: "/admin/categories", icon: Tags },
  { name: "Lokasyonlar", href: "/admin/locations", icon: MapPin },
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

        <nav className="mt-8">
          <ul className="space-y-2 px-3">
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
        </nav>
      </div>
    </>
  );
}
