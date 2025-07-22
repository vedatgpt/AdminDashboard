import React from 'react';
import ModernNavbar from '@/components/Navbar';
import NavbarMobile from '@/components/Navbar-mobile';

interface CreateListingLayoutProps {
  children: React.ReactNode;
  stepNumber?: number;
}

export default function CreateListingLayout({ children, stepNumber }: CreateListingLayoutProps) {
  // Generate dynamic title based on step number
  const getStepTitle = () => {
    if (!stepNumber) return "İlan Ver";
    return `İlan Ver - ${stepNumber}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navbar */}
      <div className="lg:hidden">
        <NavbarMobile title={getStepTitle()} />
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