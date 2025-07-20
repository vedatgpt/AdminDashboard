import React from 'react';

const NavbarMobile: React.FC = () => {
  return (
    <header className="flex flex-wrap md:justify-start md:flex-nowrap z-50 w-full bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
      <nav className="relative max-w-[85rem] w-full mx-auto px-4 md:flex md:items-center md:justify-between md:px-6 lg:px-8 xl:px-0" aria-label="Global">
        {/* Mobile navbar - only show "İlan Ver" in center */}
        <div className="flex items-center justify-center w-full py-3">
          <span className="text-lg font-semibold text-gray-800 dark:text-white">
            İlan Ver
          </span>
        </div>
      </nav>
    </header>
  );
};

export default NavbarMobile;