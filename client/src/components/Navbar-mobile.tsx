import React from 'react';
import { ChevronLeftIcon, XIcon } from 'lucide-react';

const NavbarMobile: React.FC = () => {
  const handleBackClick = () => {
    // Navigate back or to previous page
    window.history.back();
  };

  const handleCloseClick = () => {
    // Navigate to home page or close
    window.location.href = '/';
  };

  return (
    <div className="fixed top-0 w-full bg-white border-b border-gray-300 z-50">
      <header className="flex items-center justify-center w-full h-[56px]">
        <div className="flex items-center justify-between w-full max-w-screen-xl px-4 sm:px-6 md:px-8 lg:px-8">
          {/* Left side - Back arrow */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={handleBackClick}
              className="text-gray-600 hover:text-gray-800 transition-colors"
              aria-label="Geri git"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Center - İlan Ver title */}
          <div className="flex items-center justify-center flex-1">
            <span className="text-lg font-semibold text-gray-800">
              İlan Ver
            </span>
          </div>

          {/* Right side - Close X */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={handleCloseClick}
              className="text-gray-600 hover:text-gray-800 transition-colors"
              aria-label="Kapat"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default NavbarMobile;