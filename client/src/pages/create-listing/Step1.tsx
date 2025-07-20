import { useState, useEffect } from 'react';
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
  const flatCategories = allCategories.flat();

  useEffect(() => {
    if (categoryPath.length === 0) {
      // Show root level categories
      const rootCategories = flatCategories.filter(cat => !cat.parentId);
      setCurrentCategories(rootCategories);
    } else {
      // Show children of last selected category
      const lastCategory = categoryPath[categoryPath.length - 1];
      const childCategories = flatCategories.filter(cat => cat.parentId === lastCategory.id);
      setCurrentCategories(childCategories);
    }
  }, [categoryPath, flatCategories]);

  // Check if category has children
  const hasChildren = (categoryId: number): boolean => {
    return flatCategories.some(cat => cat.parentId === categoryId);
  };

  // Handle category selection
  const handleCategorySelect = (category: Category) => {
    const newPath = [...categoryPath, category];
    setCategoryPath(newPath);

    // If this is a leaf category (no children), set as final selection
    if (!hasChildren(category.id)) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Match navbar padding: px-4 sm:px-6 lg:px-8 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            İlan Ver
          </h1>
          <p className="text-gray-600 mb-6">
            İlanınızı vermek için önce kategori seçin
          </p>
          
          <ProgressBar currentStep={1} totalSteps={7} />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          
          {/* Step Title */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Adım 1: Kategori Seçin
            </h2>
            <p className="text-gray-600 text-sm">
              İlanınızın kategorisini seçerek başlayın. Doğru kategori seçimi ilanınızın daha çok görülmesini sağlar.
            </p>
          </div>

          {/* Breadcrumb Navigation */}
          <BreadcrumbNav 
            categoryPath={categoryPath}
            onCategoryClick={handleBreadcrumbClick}
          />

          {/* Categories Grid */}
          {currentCategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {currentCategories.map(category => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  hasSubcategories={hasChildren(category.id)}
                  onClick={() => handleCategorySelect(category)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">Bu kategoride alt kategori bulunmuyor</p>
            </div>
          )}

          {/* Selected Category Info */}
          {state.selectedCategory && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-green-800 font-medium">
                    Kategori seçildi: {state.selectedCategory.name}
                  </p>
                  {state.selectedCategory.categoryType && (
                    <p className="text-green-600 text-sm">
                      {state.selectedCategory.categoryType}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
            >
              İptal Et
            </button>

            <button
              onClick={handleContinue}
              disabled={!state.selectedCategory}
              className="px-8 py-3 bg-[#EC7830] text-white rounded-lg hover:bg-[#d6691a] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              Devam Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}