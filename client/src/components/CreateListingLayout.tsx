import React from 'react';
import { useLocation } from 'wouter';
import { useListing } from '@/contexts/ListingContext';
import ModernNavbar from '@/components/Navbar';
import NavbarMobile from '@/components/Navbar-mobile';

interface CreateListingLayoutProps {
  children: React.ReactNode;
  stepNumber?: number;
  customBackHandler?: () => void;
}

export default function CreateListingLayout({ children, stepNumber, customBackHandler }: CreateListingLayoutProps) {
  const [, navigate] = useLocation();
  const { state } = useListing();
  const { categoryPath } = state;

  // Generate dynamic title based on step number
  const getStepTitle = () => {
    if (!stepNumber) return "İlan Ver";

    const stepTitles: { [key: number]: string } = {
      1: "İlan Ver",
      2: "Temel Bilgiler", 
      3: "Fotoğraf",
      4: "Önizleme",
      5: "Paket Seçimi"
    };

    return stepTitles[stepNumber] || `İlan Ver - ${stepNumber}`;
  };

  // Determine if back button should be shown
  const shouldShowBackButton = () => {
    if (!stepNumber) return false;

    if (stepNumber === 1) {
      // Step 1: Show back button when any category is selected (including first main category)
      return categoryPath && categoryPath.length > 0;
    } else {
      // Step 2, 3, etc: Always show back button
      return true;
    }
  };

  // Handle back button click
  const handleBackClick = () => {
    if (!stepNumber) return;

    if (customBackHandler) {
      // Use custom back handler if provided (for Step1 category navigation)
      customBackHandler();
    } else if (stepNumber > 1) {
      // Step 2, 3, etc: Navigate to previous step with classifiedId preservation
      const classifiedId = state.classifiedId;
      const classifiedIdParam = classifiedId ? `?classifiedId=${classifiedId}` : '';
      navigate(`/create-listing/step-${stepNumber - 1}${classifiedIdParam}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Navbar */}
      <div className="lg:hidden">
        <NavbarMobile 
          title={getStepTitle()}
          showBackButton={shouldShowBackButton()}
          onBackClick={handleBackClick}
        />
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