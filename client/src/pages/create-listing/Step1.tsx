import React, { useState, useEffect } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useListing } from '@/contexts/ListingContext';
import { useLocation } from 'wouter';
import { Category } from '@shared/schema';

import ProgressBar from '@/components/listing/ProgressBar';
import BreadcrumbNav from '@/components/listing/BreadcrumbNav';
import CategoryCard from '@/components/listing/CategoryCard';

export default function CreateListingStep1() {
  const [, navigate] = useLocation();
  const { state, dispatch } = useListing();
  const { data: allCategories = [], isLoading } = useCategories();
  
  const [currentCategories, setCurrentCategories] = useState<Category[]>([]);
  const [categoryPath, setCategoryPath] = useState<Category[]>([]);

  // Build flat categories array for easy lookup  
  const flatCategories = React.useMemo(() => {
    const flatten = (categories: Category[]): Category[] => {
      const result: Category[] = [];
      for (const category of categories) {
        result.push(category);
        if (category.children && category.children.length > 0) {
          result.push(...flatten(category.children));
        }
      }
      return result;
    };
    return flatten(allCategories);
  }, [allCategories]);

  useEffect(() => {
    if (allCategories.length > 0) {
      if (categoryPath.length === 0) {
        // Show root level categories
        const rootCategories = allCategories.filter(cat => !cat.parentId);
        setCurrentCategories(rootCategories);
      } else {
        // Show children of last selected category
        const lastCategory = categoryPath[categoryPath.length - 1];
        const childCategories = lastCategory.children || [];
        setCurrentCategories(childCategories);
      }
    }
  }, [categoryPath, allCategories]);

  // Check if category has children
  const hasChildren = (category: Category): boolean => {
    return !!(category.children && category.children.length > 0);
  };

  // Handle category selection
  const handleCategorySelect = (category: Category) => {
    const newPath = [...categoryPath, category];
    setCategoryPath(newPath);

    // If this is a leaf category (no children), set as final selection
    if (!hasChildren(category)) {
      dispatch({
        type: 'SET_CATEGORY',
        payload: { category, path: newPath }
      });
    }
  };

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (category: Category | null, index: number) => {
    if (category === null) {
      // Go back to root
      setCategoryPath([]);
      dispatch({
        type: 'SET_CATEGORY',
        payload: { category: null, path: [] }
      });
    } else {
      // Go back to specific level
      const newPath = categoryPath.slice(0, index + 1);
      setCategoryPath(newPath);
      dispatch({
        type: 'SET_CATEGORY',
        payload: { category, path: newPath }
      });
    }
  };

  // Handle continue to next step
  const handleContinue = () => {
    if (state.selectedCategory) {
      dispatch({ type: 'SET_STEP', payload: 2 });
      navigate('/create-listing/step-2');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navbar spacing: px-4 sm:px-6 lg:px-8 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EC7830]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Match navbar padding: px-4 sm:px-6 lg:px-8 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Breadcrumb Navigation */}
        <BreadcrumbNav 
          categoryPath={categoryPath}
          onCategoryClick={handleBreadcrumbClick}
        />

        {/* Categories Grid - Sahibinden style */}
        {currentCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {currentCategories.map(category => (
              <div
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-4 cursor-pointer transition-colors"
              >
                <div className="space-y-2">
                  {category.icon && (
                    <div className="flex justify-center">
                      <img 
                        src={`${window.location.origin}/uploads/category-icons/${category.icon}`}
                        alt={category.name}
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-gray-900 leading-tight">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">Bu kategoride alt kategori bulunmuyor</p>
          </div>
        )}

        {/* Navigation Button - Only show when category is selected */}
        {state.selectedCategory && (
          <div className="mt-8 text-center">
            <button
              onClick={handleContinue}
              className="px-8 py-3 bg-[#EC7830] text-white rounded-lg hover:bg-[#d6691a] transition-all duration-200 font-medium"
            >
              Devam Et
            </button>
          </div>
        )}
      </div>
    </div>
  );
}