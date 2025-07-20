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
    // Check if this is a root level category (no parent)
    const isRootCategory = !category.parentId;
    
    let newPath;
    
    if (isRootCategory && categoryPath.length > 0) {
      // If selecting a different root category, reset path
      newPath = [category];
    } else {
      // Check if this category is already selected (prevent duplicates)
      const existingIndex = categoryPath.findIndex(c => c.id === category.id);
      
      if (existingIndex >= 0) {
        // If category exists in path, truncate to that point
        newPath = categoryPath.slice(0, existingIndex + 1);
      } else {
        // Add new category to path
        newPath = [...categoryPath, category];
      }
    }
    
    setCategoryPath(newPath);

    // Auto-scroll to the newest box
    setTimeout(() => {
      const container = document.querySelector('.category-boxes-container');
      if (container) {
        container.scrollLeft = container.scrollWidth;
      }
    }, 100);

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

  // Handle continue to next step - removed as per user request

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

  // Build category levels for horizontal boxes
  const getCategoryLevels = () => {
    const levels = [];
    
    // First level: Root categories
    const rootCategories = allCategories.filter(cat => !cat.parentId);
    if (rootCategories.length > 0) {
      levels.push(rootCategories);
    }
    
    // Add subsequent levels based on category path
    let currentLevelCategories = rootCategories;
    for (let i = 0; i < categoryPath.length; i++) {
      const selectedCategory = categoryPath[i];
      const nextLevelCategories = selectedCategory.children || [];
      if (nextLevelCategories.length > 0) {
        levels.push(nextLevelCategories);
        currentLevelCategories = nextLevelCategories;
      }
    }
    
    return levels;
  };

  const categoryLevels = getCategoryLevels();

  return (
    <div className="min-h-screen bg-white">
      {/* Match navbar padding: px-4 sm:px-6 lg:px-8 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Breadcrumb Navigation */}
        {categoryPath.length > 0 && (
          <BreadcrumbNav 
            categoryPath={categoryPath}
            onCategoryClick={handleBreadcrumbClick}
          />
        )}

        {/* Sahibinden style horizontal category boxes */}
        <div className="flex gap-4 overflow-x-auto pb-4 category-boxes-container">
          {categoryLevels.map((levelCategories, levelIndex) => (
            <div key={levelIndex} className="flex-shrink-0 w-60 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-2 max-h-80 overflow-y-auto">
                {levelCategories.map(category => (
                  <div
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={`flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer transition-colors rounded text-sm ${
                      categoryPath.some(c => c.id === category.id) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {category.icon && (
                      <img 
                        src={`${window.location.origin}/uploads/category-icons/${category.icon}`}
                        alt={category.name}
                        className="w-4 h-4 object-contain flex-shrink-0"
                      />
                    )}
                    <span className="hover:text-blue-600 transition-colors">
                      {category.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}