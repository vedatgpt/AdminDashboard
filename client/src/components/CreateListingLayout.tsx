import React from 'react';
import ModernNavbar from '@/components/Navbar';
import NavbarMobile from '@/components/Navbar-mobile';

interface CreateListingLayoutProps {
  children: React.ReactNode;
}

export default function CreateListingLayout({ children }: CreateListingLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navbar */}
      <div className="lg:hidden">
        <NavbarMobile />
      </div>
      
      {/* Desktop Navbar */}
      <div className="hidden lg:block">
        <ModernNavbar />
      </div>
      
      {/* Main Content - No extra wrapper needed, children handle their own layout */}
      {children}
    </div>
  );
}