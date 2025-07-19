import { useState } from 'react';
import { UserIcon, SearchIcon, BellIcon, HeartIcon, MessageCircleIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import logoPath from "@assets/logo_1752808818099.png";

interface DaisyNavbarProps {
  onSearch?: (searchTerm: string) => void;
}

export default function DaisyNavbar({ onSearch }: DaisyNavbarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || searchTerm.length < 2) return;
    
    if (onSearch) {
      onSearch(searchTerm.trim());
    } else {
      console.log('Arama yapılıyor:', searchTerm.trim());
    }
  };

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

  return (
    <div className="navbar bg-base-100 shadow-sm border-b">
      <div className="navbar-start">
        <Link href="/">
          <img
            src={logoPath}
            alt="Logo"
            className="h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <form onSubmit={handleSearchSubmit} className="form-control">
          <div className="input-group">
            <input
              type="text"
              placeholder="Kelime, ilan no veya galeri adı ile ara"
              className="input input-bordered w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn btn-square btn-primary">
              <SearchIcon className="w-6 h-6" />
            </button>
          </div>
        </form>
      </div>

      <div className="navbar-end">
        {/* Mobile search */}
        <div className="lg:hidden">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
              <SearchIcon className="w-5 h-5" />
            </div>
            <div tabIndex={0} className="dropdown-content z-[1] card card-compact w-64 p-2 shadow bg-base-100 border">
              <form onSubmit={handleSearchSubmit} className="form-control">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Ara..."
                    className="input input-bordered input-sm flex-1"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    <SearchIcon className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Notification Icons */}
        <div className="hidden sm:flex">
          <button className="btn btn-ghost btn-circle">
            <BellIcon className="w-5 h-5" />
          </button>
          <button className="btn btn-ghost btn-circle">
            <HeartIcon className="w-5 h-5" />
          </button>
          <button className="btn btn-ghost btn-circle">
            <MessageCircleIcon className="w-5 h-5" />
          </button>
        </div>

        {/* User Menu */}
        {!isAuthenticated ? (
          <Link href="/login" className="btn btn-primary">
            Giriş Yap
          </Link>
        ) : (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost">
              <span className="hidden lg:inline">{getDisplayName()}</span>
              <div className="avatar">
                <div className="w-8 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
              </div>
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li className="menu-title">
                <span>{getDisplayName()}</span>
              </li>
              <div className="divider my-1"></div>
              <li><a onClick={() => handleMenuItemClick("Profil")}>Profil</a></li>
              <li><a onClick={() => handleMenuItemClick("Hesap Ayarları")}>Hesap Ayarları</a></li>
              <li><a onClick={() => handleMenuItemClick("İletişim")}>İletişim</a></li>
              <li><a onClick={() => handleMenuItemClick("Şifre Değiştir")}>Şifre Değiştir</a></li>
              <div className="divider my-1"></div>
              <li><a onClick={() => handleMenuItemClick("Çıkış Yap")} className="text-error">Çıkış Yap</a></li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}