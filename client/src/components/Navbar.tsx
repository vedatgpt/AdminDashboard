import { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, UserIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import logoPath from "@assets/logo_1752808818099.png";

// Modern minimal icons
const SearchIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

// UserDropdown component
const UserDropdown = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    setIsDropdownOpen(false);
  };

  const handleProfileClick = () => {
    navigate("/account/profile");
    setIsDropdownOpen(false);
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
        <button className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none">
          Giriş Yap
        </button>
      </Link>
    );
  }

  return (
    <div className="relative inline-flex" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
        aria-haspopup="menu"
        aria-expanded={isDropdownOpen}
        aria-label="User Menu"
      >
        <span>{getDisplayName()}</span>
        <ChevronDownIcon className={`size-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 top-full z-50 min-w-60 bg-white shadow-lg rounded-lg mt-2 border border-gray-200" role="menu" aria-orientation="vertical">
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
          <div className="p-1 space-y-0.5">
            <button
              className="flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 w-full text-left"
              onClick={() => handleMenuItemClick("Profil")}
            >
              Profil
            </button>
            <button
              className="flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 w-full text-left"
              onClick={() => handleMenuItemClick("Hesap Ayarları")}
            >
              Hesap Ayarları
            </button>
            <button
              className="flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 w-full text-left"
              onClick={() => handleMenuItemClick("İletişim")}
            >
              İletişim
            </button>
            <button
              className="flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 w-full text-left"
              onClick={() => handleMenuItemClick("Şifre Değiştir")}
            >
              Şifre Değiştir
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            <button
              className="flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:bg-red-50 w-full text-left"
              onClick={() => handleMenuItemClick("Çıkış Yap")}
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface ModernNavbarProps {
  onSearch?: (searchTerm: string) => void;
}

export default function ModernNavbar({ onSearch }: ModernNavbarProps) {
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

      }
    } catch (error) {

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
                decoding="sync"
              />
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="relative w-[320px] lg:w-[360px] xl:w-[400px] hidden lg:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Kelime, ilan no veya galeri adı ile ara"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                className="w-full pl-10 pr-10 h-9 rounded-lg bg-gray-100 border-none focus:bg-gray-100 focus:outline-none focus:ring-0 focus:border-none focus:shadow-none transition-all duration-200 text-sm lg:text-base py-3 px-4 block disabled:opacity-50 disabled:pointer-events-none"
                style={{ boxShadow: 'none !important', outline: 'none !important', border: 'none !important' }}
                disabled={isSearching}
              />
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              {searchTerm && (
                <button
                  onMouseDown={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 hover:bg-transparent text-gray-400 hover:text-gray-600"
                >
                  <span className="h-4 w-4">×</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Side User */}
          <div className="flex items-center">
            <UserDropdown />
          </div>
        </div>
      </header>
    </div>
  );
}