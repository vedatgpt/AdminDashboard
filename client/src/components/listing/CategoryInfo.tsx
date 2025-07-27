import React from 'react';
import { useLocation } from 'wouter';
import { Category } from '@shared/schema';
import BreadcrumbNav from './BreadcrumbNav';

interface CategoryInfoProps {
  categoryPath: Category[];
}

export default function CategoryInfo({ categoryPath }: CategoryInfoProps) {
  const [, navigate] = useLocation();

  return (
    <div className="mb-6 lg:mt-0 mt-3">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 text-md leading-tight">
              Seçtiğiniz Kategori Bilgileri
            </h3>
            {/* Breadcrumb kutunun içinde alt sol kısmında */}
            <div className="mt-3">
              {categoryPath && categoryPath.length > 0 && (
                <BreadcrumbNav 
                  categoryPath={categoryPath}
                  onCategoryClick={() => {}}
                  disableFirstCategory={true}
                />
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/create-listing/step-1')}
            className="text-orange-500 text-sm font-medium hover:text-orange-600 hover:underline transition-colors"
          >
            Değiştir
          </button>
        </div>
      </div>
    </div>
  );
} 