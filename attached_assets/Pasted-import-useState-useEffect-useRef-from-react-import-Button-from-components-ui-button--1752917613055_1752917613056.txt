import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDownIcon, UserIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import logoPath from "@assets/logo_1752808818099.png";

// Modern minimal icons
const SearchIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

// UserDropdown component
const UserDropdown = ({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleMenuItemClick = (item: string) => {
    switch (item) {
      case "Profil":
        navigate("/account/profile");
        break;
      case "Hesap Ayarları":
        navigate("/account");
        break;
      case "İletişim":
        navigate("/account/contact");
        break;
      case "Şifre Değiştir":
        navigate("/account/change-password");
        break;
      case "Çıkış Yap":
        logout();
        break;
    }
    onOpenChange(false);
  };

  const handleProfileClick = () => {
    navigate("/account/profile");
    onOpenChange(false);
  };

  // Get proper display name based on user type
  const getDisplayName = () => {
    if (!user) return "Hesabım";

    if (user.role === "corporate" && user.companyName) {
      return user.companyName;
    }

    if (user.role === "individual") {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
    }

    return user.username || "Hesabım";
  };

  const getDropdownDisplayName = () => {
    if (!user) return "Kullanıcı";

    if (user.role === "corporate" && user.companyName) {
      return user.companyName;
    }

    if (user.role === "individual") {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
    }

    return user.username || "Kullanıcı";
  };

  if (!isAuthenticated) {
    return (
      <Link href="/login">
        <Button 
          variant="outline"
          className="border-gray-300 font-medium text-gray-700 text-sm whitespace-nowrap h-[36px] rounded-md hover:bg-gray-50 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors duration-200"
        >
          Giriş Yap
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-gray-300 font-medium text-gray-700 text-sm whitespace-nowrap h-[36px] rounded-md hover:bg-gray-50 focus-visible:ring-0 focus-visible:ring-offset-0 flex w-auto px-3 gap-1 transition-colors duration-200"
        >
          <span>{getDisplayName()}</span>
          <ChevronDownIcon className="w-4 h-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[250px] mt-2 rounded-lg border-gray-200"
        align="end"
        onCloseAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div 
          className="flex items-center gap-2 p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
          onClick={handleProfileClick}
        >
          <div className="w-10 h-10 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center">
            <UserIcon className="w-6 h-6 text-gray-500" />
          </div>
          <div className="font-medium text-gray-900">
            {getDropdownDisplayName()}
          </div>
        </div>
        <div className="py-1">
          {["Profil", "Hesap Ayarları", "İletişim", "Şifre Değiştir", "Çıkış Yap"].map((item, index) => (
            <div key={index}>
              {index === 4 && <Separator className="my-1" />}
              <DropdownMenuItem 
                className="px-4 py-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                onClick={() => handleMenuItemClick(item)}
              >
                {item}
              </DropdownMenuItem>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface ModernNavbarProps {
  onSearch?: (searchTerm: string) => void;
}

export default function ModernNavbar({ onSearch }: ModernNavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchSubmit = async () => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      return;
    }

    setIsSearching(true);
    try {
      if (onSearch) {
        onSearch(searchTerm.trim());
      } else {
        // Default search behavior
        console.log('Arama yapılıyor:', searchTerm.trim());
      }
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchTerm("");
  };

  return (
    <div className="sticky top-0 w-full bg-white border-b border-gray-300 z-50">
      <header className="flex items-center justify-center w-full h-[56px]">
        <div className="flex items-center justify-between w-full max-w-screen-xl px-4 sm:px-6 md:px-8 lg:px-8">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/">
              <img
                className="w-[140px] h-8 flex-shrink-0 cursor-pointer transition-opacity duration-200 hover:opacity-80"
                alt="Logo"
                src={logoPath}
                loading="eager"
                fetchpriority="high"
                decoding="sync"
              />
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="relative w-[320px] lg:w-[360px] xl:w-[400px] hidden lg:block">
            <div className="relative">
              <Input
                type="text"
                placeholder="Kelime, ilan no veya galeri adı ile ara"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                className="w-full pl-10 pr-10 h-9 rounded-lg bg-gray-100 border-0 focus:bg-gray-100 focus:ring-1 focus:ring-gray-300 transition-all duration-200 text-sm lg:text-base"
                disabled={isSearching}
              />
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onMouseDown={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 hover:bg-transparent"
                >
                  <span className="h-4 w-4 text-gray-400">×</span>
                </Button>
              )}
            </div>
          </div>

          {/* Right Side User */}
          <div className="flex items-center">
            <UserDropdown 
              isOpen={isDropdownOpen} 
              onOpenChange={setIsDropdownOpen} 
            />
          </div>
        </div>
      </header>
    </div>
  );
};