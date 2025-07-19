import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDownIcon, UserIcon, XIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import logoPath from "@assets/logo_1752808818099.png";

// Modern minimal icons
const BellIcon = ({ filled = false, className = "w-6 h-6" }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);

const HeartIcon = ({ filled = false, className = "w-6 h-6" }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const MessageIcon = ({ filled = false, className = "w-6 h-6" }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

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
          className="border-gray-300 font-medium text-gray-700 text-sm whitespace-nowrap h-[36px] rounded-md hover:bg-gray-50 focus-visible:ring-0 focus-visible:ring-offset-0 hidden lg:flex lg:w-auto lg:px-3 lg:gap-1 transition-colors duration-200"
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
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchClick = () => {
    setIsSearchActive(true);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  const handleSearchClose = () => {
    setIsSearchActive(false);
    setSearchTerm("");
  };

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

  // Escape key ile search'i kapat
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSearchActive) {
        handleSearchClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchActive]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isSearchActive) {
        setIsSearchActive(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isSearchActive]);

  return (
    <div className="sticky top-0 w-full bg-white border-b border-gray-300 z-50">
      <header className="flex items-center justify-center w-full h-[56px]">
        <div className="flex items-center justify-between w-full max-w-screen-xl px-2 sm:px-4 md:px-6 lg:px-8">
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

          {/* Search Mode - Mobile/Tablet */}
          {isSearchActive && (
            <div className="flex items-center gap-2 flex-1 max-w-md mx-4 lg:hidden">
              <div className="relative flex-1">
                <div className="relative">
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Kelime, ilan no ile ara"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    className="w-full pl-10 pr-10 h-9 rounded-lg bg-gray-100 border-0 focus:bg-gray-100 focus:ring-1 focus:ring-gray-300 transition-all duration-200 text-sm"
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
                      <XIcon className="h-4 w-4 text-gray-400" />
                    </Button>
                  )}
                </div>
              </div>
              <button
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                onClick={handleSearchClose}
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Normal View */}
          {!isSearchActive && (
            <>
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
                      <XIcon className="h-4 w-4 text-gray-400" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Right Side Icons and User */}
              <div className="flex items-center gap-1 sm:gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSearchClick}
                  className="lg:hidden h-9 w-9 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                >
                  <SearchIcon className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:flex h-9 w-9 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                >
                  <BellIcon className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:flex h-9 w-9 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                >
                  <HeartIcon className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:flex h-9 w-9 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                >
                  <MessageIcon className="h-5 w-5" />
                </Button>

                <UserDropdown 
                  isOpen={isDropdownOpen} 
                  onOpenChange={setIsDropdownOpen} 
                />
              </div>
            </>
          )}
        </div>
      </header>
    </div>
  );
}