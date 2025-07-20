import React, { ReactNode } from 'react';
import ModernNavbar from '@/components/Navbar';
import NavbarMobile from '@/components/Navbar-mobile';
import BreadcrumbNav from '@/components/listing/BreadcrumbNav';
import { useListing } from '@/contexts/ListingContext';

interface ListingLayoutProps {
  children: ReactNode;
  showBreadcrumb?: boolean;
}

export default function ListingLayout({ children, showBreadcrumb = false }: ListingLayoutProps) {
  const { state } = useListing();
  const { selectedCategory } = state;

  // Navbar'lar için dummy search handler
  const handleSearch = (query: string) => {
    console.log('Search query:', query);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Navbar */}
      <div className="hidden lg:block">
        <ModernNavbar onSearch={handleSearch} />
      </div>
      
      {/* Mobile/Tablet Navbar */}
      <div className="lg:hidden">
        <NavbarMobile 
          showBackButton={showBreadcrumb}
          onBackClick={() => window.history.back()}
        />
      </div>

      {/* Mobile/Tablet Fixed Header/Breadcrumb */}
      {showBreadcrumb && (
        <div className="lg:hidden fixed top-[56px] left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-2">
          {selectedCategory && (
            <BreadcrumbNav 
              categoryPath={[selectedCategory]}
              onCategoryClick={() => {}}
            />
          )}
        </div>
      )}
      
      {/* Main content with dynamic padding based on breadcrumb presence */}
      <div className={showBreadcrumb ? "lg:pt-6 pt-[108px]" : "lg:pt-6 pt-[56px]"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:py-3">
          
          {/* Desktop Breadcrumb Navigation */}
          {showBreadcrumb && selectedCategory && (
            <div className="hidden lg:block mb-6">
              <BreadcrumbNav 
                categoryPath={[selectedCategory]}
                onCategoryClick={() => {}}
              />
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}