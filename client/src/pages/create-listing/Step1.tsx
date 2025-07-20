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
    
    if (isRootCategory) {
      // If selecting a root category, reset path completely
      newPath = [category];
    } else {
      // Find which level this category belongs to
      const currentLevel = getCategoryLevels().findIndex(levelCategories => 
        levelCategories.some(c => c.id === category.id)
      );
      
      if (currentLevel >= 0) {
        // Replace selection at this level and remove all subsequent levels
        newPath = categoryPath.slice(0, currentLevel);
        newPath.push(category);
      } else {
        // Fallback: add to end of path
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
    // Always go back to root (card layout) when breadcrumb is clicked
    setCategoryPath([]);
    dispatch({
      type: 'SET_CATEGORY',
      payload: { category: null, path: [] }
    });
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

        {/* Category Selection */}
        {categoryPath.length === 0 ? (
          /* Root categories - Card layout */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {allCategories.filter(cat => !cat.parentId).map(category => (
              <div
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className="bg-white border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all duration-200 group h-32 flex flex-col justify-center"
              >
                <div className="flex flex-col items-center space-y-3">
                  {category.icon && (
                    <div className="w-12 h-12 flex items-center justify-center">
                      <img 
                        src={`${window.location.origin}/uploads/category-icons/${category.icon}`}
                        alt={category.name}
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900 text-sm leading-tight">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Sub-categories - Box layout */
          <div className="flex gap-4 overflow-x-auto pb-4 category-boxes-container">
            {categoryLevels.slice(1).map((levelCategories, levelIndex) => {
              const actualLevelIndex = levelIndex + 1; // Adjust index since we're skipping first level
              return (
                <div key={actualLevelIndex} className={`flex-shrink-0 w-60 border border-gray-200 rounded-lg overflow-hidden ${
                  actualLevelIndex < categoryPath.length ? 'bg-gray-50' : 'bg-blue-50'
                }`}>
                  <div className="p-2 max-h-80 overflow-y-auto">
                    {levelCategories.map(category => {
                      const isCurrentLevelSelected = actualLevelIndex < categoryPath.length && categoryPath[actualLevelIndex]?.id === category.id;
                      
                      return (
                        <div
                          key={category.id}
                          onClick={() => handleCategorySelect(category)}
                          className={`flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer transition-colors rounded text-sm ${
                            isCurrentLevelSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
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
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}