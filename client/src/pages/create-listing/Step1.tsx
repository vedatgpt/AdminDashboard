import React, { useState, useEffect } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useListing } from '@/contexts/ListingContext';
import { useLocation } from 'wouter';
import { useDraftListing, useCreateDraftListing, useUpdateDraftListing, useUserDraftForCategory, useDeleteDraftListing, useUserDraftListings, DraftListing } from '@/hooks/useDraftListing';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";
import { useSmartPrefetch } from '@/hooks/useSmartPrefetch';
import { useStep2Prefetch } from '@/hooks/useStep2Prefetch';
import { useStep1Prefetch } from '@/hooks/useStep1Prefetch';
import { useQueryClient } from '@tanstack/react-query';
import { Category } from '@shared/schema';
import DraftContinueModal from '@/components/DraftContinueModal';

import ProgressBar from '@/components/listing/ProgressBar';
import BreadcrumbNav from '@/components/listing/BreadcrumbNav';
import CategoryCard from '@/components/listing/CategoryCard';

import { PageLoadIndicator } from '@/components/PageLoadIndicator';
import { IOSSpinner } from '@/components/iOSSpinner';

export default function CreateListingStep1() {
  const [, navigate] = useLocation();
  const { state, dispatch } = useListing();
  const { data: allCategories = [], isLoading } = useCategories();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { handleCategoryHover } = useSmartPrefetch();
  const { prefetchStep2Data } = useStep2Prefetch();
  const { smartPrefetchStep1 } = useStep1Prefetch();

  // Redirect to login if not authenticated - simplified
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [authLoading, isAuthenticated]);

  // Step1 prefetch - sayfa açılır açılmaz draft modal için veri prefetch'i
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.id) {
      smartPrefetchStep1(user.id, 'Step1 sayfa açılışı');
    }
  }, [authLoading, isAuthenticated, user?.id, smartPrefetchStep1]);
  
  const [currentCategories, setCurrentCategories] = useState<Category[]>([]);
  const [categoryPath, setCategoryPath] = useState<Category[]>([]);
  
  // URL parameter support for classified ID
  const urlParams = new URLSearchParams(window.location.search);
  const classifiedIdParam = urlParams.get('classifiedId');
  const classifiedId = classifiedIdParam ? parseInt(classifiedIdParam) : undefined;
  
  // Draft listing hooks - only enabled when authenticated
  const { data: draftData } = useDraftListing(classifiedId);
  const createDraftMutation = useCreateDraftListing();
  const updateDraftMutation = useUpdateDraftListing();
  const deleteDraftMutation = useDeleteDraftListing();
  
  // Modal state
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<Category | null>(null);
  const [pendingPath, setPendingPath] = useState<Category[]>([]);
  
  // Get all user drafts for checking main categories
  // DEPLOY FIX: Enhanced draft listing with shorter cache for modal system
  const { data: allUserDrafts = [], refetch: refetchUserDrafts } = useUserDraftListings();

  // Build flat categories array for easy lookup - optimized
  const flatCategories = React.useMemo(() => {
    if (!allCategories.length) return [];
    const flatten = (categories: Category[]): Category[] => {
      const result: Category[] = [];
      for (const category of categories) {
        result.push(category);
        if (category.children?.length) {
          result.push(...flatten(category.children));
        }
      }
      return result;
    };
    return flatten(allCategories);
  }, [allCategories]);

  // Initialize classifiedId from URL on component mount
  useEffect(() => {
    if (classifiedId && !state.classifiedId) {
      dispatch({ type: 'SET_CLASSIFIED_ID', payload: classifiedId });
      dispatch({ type: 'SET_IS_DRAFT', payload: true });
    }
  }, [classifiedId, state.classifiedId, dispatch]);

  // Load draft data when available
  useEffect(() => {
    if (draftData && state.classifiedId && flatCategories.length > 0) {
      // Load draft data into context
      dispatch({ 
        type: 'LOAD_DRAFT', 
        payload: { 
          classifiedId: state.classifiedId, 
          draft: draftData 
        } 
      });
      
      // If draft has category, set it up
      if (draftData.categoryId) {
        const category = flatCategories.find(cat => cat.id === draftData.categoryId);
        if (category) {
          // Build category path
          const buildPath = (cat: Category): Category[] => {
            const path: Category[] = [];
            let current = cat;
            while (current) {
              path.unshift(current);
              current = flatCategories.find(c => c.id === current.parentId) as Category;
            }
            return path;
          };
          
          const path = buildPath(category);
          setCategoryPath(path);
          dispatch({ type: 'SET_CATEGORY', payload: { category, path } });
        }
      }
    }
  }, [draftData, state.classifiedId, flatCategories, dispatch]);

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

  // Check if there's a draft for the main category
  const checkForMainCategoryDraft = (category: Category): DraftListing | null => {
    if (!isAuthenticated || !allUserDrafts) {
      console.log('🔍 Draft kontrol: Auth yok veya draft listesi yok');
      return null;
    }
    
    console.log(`🔍 Ana kategori "${category.name}" (ID:${category.id}) için draft kontrol ediliyor...`);
    console.log('📊 Mevcut drafts:', allUserDrafts.map(d => `ID:${d.id} categoryId:${d.categoryId}`));
    console.log('📊 Flat categories count:', flatCategories.length);
    
    // Ana kategori için draft kontrolü - ana kategorinin alt kategorilerinde herhangi bir draft var mı?
    const mainCategoryDraft = allUserDrafts.find(draft => {
      if (!draft.categoryId) {
        console.log(`❌ Draft ${draft.id}: categoryId yok`);
        return false;
      }
      
      console.log(`🔍 Draft ${draft.id} kontrol ediliyor (categoryId: ${draft.categoryId})`);
      
      // Draft'ın kategorisini bul
      const draftCategory = flatCategories.find(cat => cat.id === draft.categoryId);
      if (!draftCategory) {
        console.log(`❌ Draft ${draft.id}: kategori bulunamadı (categoryId: ${draft.categoryId})`);
        return false;
      }
      
      console.log(`✅ Draft ${draft.id}: kategori bulundu: "${draftCategory.name}"`);
      
      // Draft'ın ana kategorisini bul (path'in en başındaki)
      let rootCategory = draftCategory;
      const pathToRoot = [rootCategory.name];
      
      while (rootCategory.parentId) {
        const parent = flatCategories.find(cat => cat.id === rootCategory.parentId);
        if (parent) {
          rootCategory = parent;
          pathToRoot.unshift(parent.name);
        } else {
          console.log(`❌ Parent kategori bulunamadı: ${rootCategory.parentId}`);
          break;
        }
      }
      
      console.log(`📍 Draft ${draft.id} path: ${pathToRoot.join(' → ')}`);
      console.log(`📍 Root kategori: "${rootCategory.name}" (ID:${rootCategory.id})`);
      console.log(`🔍 Karşılaştırma: ${rootCategory.id} === ${category.id} = ${rootCategory.id === category.id}`);
      
      return rootCategory.id === category.id;
    });
    
    if (mainCategoryDraft) {
      console.log(`✅ DRAFT BULUNDU! Draft ID: ${mainCategoryDraft.id}`);
    } else {
      console.log('❌ Hiç draft bulunamadı');
    }
    
    return mainCategoryDraft || null;
  };

  // Handle category selection - DEPLOY FIX VERSION
  const handleCategorySelect = (category: Category) => {
    console.log('🔍 DEPLOY FIX: Kategori seçildi:', category.name, 'Parent ID:', category.parentId);
    console.log('📊 Kullanıcı drafts:', allUserDrafts.map(d => `ID:${d.id} categoryId:${d.categoryId}`));
    
    // Check if this is a root level category (no parent)
    const isRootCategory = !category.parentId;
    
    let newPath;
    
    if (isRootCategory) {
      // Ana kategori seçildiğinde - mevcut draft kontrolü yap
      console.log('🔍 DEPLOY FIX: Ana kategori seçildi, draft kontrol ediliyor...');
      
      // DEPLOY FIX: Force refetch before checking drafts
      refetchUserDrafts().then(() => {
        console.log('🔄 DEPLOY FIX: Drafts yeniden yüklendi');
        
        // Ana kategori için draft var mı kontrol et
        const mainCategoryDraft = checkForMainCategoryDraft(category);
        
        if (mainCategoryDraft && isAuthenticated) {
          console.log('✅ DEPLOY FIX: Ana kategoride mevcut draft bulundu:', mainCategoryDraft.id);
          // Modal'ı göster
          setPendingCategory(category);
          setPendingPath([category]);
          setCurrentExistingDraft(mainCategoryDraft);
          setShowDraftModal(true);
          return; // Alt kategorileri yükleme, modal'a bekle
        } else {
          console.log('❌ DEPLOY FIX: Ana kategoride draft bulunamadı, normal flow devam ediyor');
          // Eğer draft yoksa normal akışı devam ettir
          const newPath = [category];
          setCategoryPath(newPath);
          dispatch({ 
            type: 'SET_CATEGORY_WITH_PATH', 
            payload: { 
              category: hasChildren(category) ? null : category,
              path: newPath 
            } 
          });
        }
      });
      
      return; // Async işlem beklendiği için early return
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
      
      // Alt kategori seçildiğinde normal işlem
      if (!hasChildren(category)) {
        setPendingCategory(category);
        setPendingPath(newPath);
      }
    }
    
    setCategoryPath(newPath);
    
    // Always update the listing context with the new path - this ensures navbar back button updates
    dispatch({ 
      type: 'SET_CATEGORY_WITH_PATH', 
      payload: { 
        category: hasChildren(category) ? null : category, // Only set as selected if it's a leaf
        path: newPath 
      } 
    });

    // Auto-scroll to the newest box
    setTimeout(() => {
      const container = document.querySelector('.category-boxes-container');
      if (container) {
        container.scrollLeft = container.scrollWidth;
      }
    }, 100);

    // Final category selection için context'i güncelle
    if (!hasChildren(category)) {
      dispatch({
        type: 'SET_CATEGORY',
        payload: { category, path: newPath }
      });
      
      // Step2 verilerini prefetch et - final kategori seçildiği anda
      prefetchStep2Data(category.id);
    }
  };

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (category: Category | null, index: number) => {
    // Always go back to root (card layout) when breadcrumb is clicked
    setCategoryPath([]);
    dispatch({
      type: 'SET_CATEGORY_WITH_PATH',
      payload: { category: null, path: [] }
    });
  };

  // State to hold the existing draft for modal
  const [currentExistingDraft, setCurrentExistingDraft] = useState<DraftListing | null>(null);

  // Handle continuing to step 2
  const handleContinueToStep2 = async () => {
    if (!pendingCategory || !pendingPath) return;

    // Check authentication first
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    try {
      let draftId: number;
      
      // Create new draft for this category
      const draftResult = await createDraftMutation.mutateAsync({
        categoryId: pendingCategory.id,
        title: null,
        description: null,
        price: null,
        customFields: null,
        photos: null,
        locationData: null,
        status: 'draft' as const,
      });
      
      draftId = draftResult.id;
      
      // Update context with new draft
      dispatch({ type: 'SET_CLASSIFIED_ID', payload: draftId });
      dispatch({ type: 'SET_IS_DRAFT', payload: true });
      dispatch({ 
        type: 'SET_CATEGORY', 
        payload: { 
          category: pendingCategory, 
          path: pendingPath 
        } 
      });
      
      // Step2 verilerini prefetch et - yeni draft oluşturulurken
      prefetchStep2Data(pendingCategory.id);
      
      // Navigate to step 2
      navigate(`/create-listing/step-2?classifiedId=${draftId}`);
    } catch (error) {
      console.error('Draft oluşturulamadı:', error);
      toast({
        title: "Hata",
        description: 'İlan taslağı oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.',
        variant: "destructive"
      });
    }
  };

  // Modal handlers
  const handleContinueWithDraft = () => {
    if (!currentExistingDraft || !pendingCategory) return;
    
    setShowDraftModal(false);
    setCurrentExistingDraft(null);
    
    // Set draft info in context
    dispatch({ type: 'SET_CLASSIFIED_ID', payload: currentExistingDraft.id });
    dispatch({ type: 'SET_IS_DRAFT', payload: true });
    dispatch({ 
      type: 'SET_CATEGORY', 
      payload: { 
        category: pendingCategory, 
        path: pendingPath 
      } 
    });
    
    // Step2 verilerini prefetch et - mevcut draft ile devam edilirken
    prefetchStep2Data(pendingCategory.id);
    
    // Navigate to step 2
    navigate(`/create-listing/step-2?classifiedId=${currentExistingDraft.id}`);
  };

  const handleCreateNewListing = async () => {
    if (!currentExistingDraft || !pendingCategory) return;
    
    try {
      console.log('🗑️ DEPLOY FIX: Yeni ilan oluşturuluyor, eski draft siliniyor...');
      console.log('Silinecek draft ID:', currentExistingDraft.id);
      
      // DEPLOY FIX: Enhanced error handling for draft deletion
      const response = await fetch(`/api/draft-listings/${currentExistingDraft.id}`, {
        method: 'DELETE',
        credentials: 'include', // Deploy fix: ensure cookies sent
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }));
        console.error('Draft silme hatası:', response.status, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Draft silinemedi`);
      }
      
      console.log('✅ Draft başarıyla silindi');
      
      // DEPLOY FIX: Force cache invalidation after successful deletion
      await refetchUserDrafts();
      
      // Modal'ı kapat
      setShowDraftModal(false);
      setCurrentExistingDraft(null);
      
      console.log('🔄 Context tamamen sıfırlanıyor...');
      
      // Tüm context'i sıfırla - eski form verilerini temizle
      dispatch({ type: 'RESET_LISTING' });
      
      // URL'den classifiedId'yi temizle
      const currentUrl = window.location.pathname;
      window.history.replaceState({}, '', currentUrl);
      
      console.log('📂 Ana kategorinin alt kategorileri gösteriliyor...');
      
      // Ana kategori seçimini devam ettir - alt kategorileri göster
      const newPath = [pendingCategory];
      setCategoryPath(newPath);
      
      // Context'i ana kategori ile güncelle (temiz state üzerinde)
      dispatch({ 
        type: 'SET_CATEGORY_WITH_PATH', 
        payload: { 
          category: null, // Ana kategori selected değil, sadece path'te
          path: newPath 
        } 
      });
      
      // Pending'i temizle
      setPendingCategory(null);
      setPendingPath([]);
      
      console.log('✅ Yeni ilan oluşturma işlemi tamamlandı');
      
    } catch (error) {
      console.error('❌ DEPLOY ERROR - Eski draft silinirken hata:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      toast({
        title: "Hata",
        description: `Eski taslak silinirken hata: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navbar spacing: px-4 sm:px-6 lg:px-8 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-96">
            <IOSSpinner size="large" />
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

  const handleSearch = (searchTerm: string) => {
    console.log('Step1 sayfasında arama:', searchTerm);
  };

  // Handle mobile back navigation
  const handleMobileBack = () => {
    if (categoryPath.length > 0) {
      const newPath = categoryPath.slice(0, -1);
      setCategoryPath(newPath);
      
      // Update listing state - fix null reference error
      const selectedCategory = newPath.length > 0 ? newPath[newPath.length - 1] : null;
      dispatch({ 
        type: 'SET_CATEGORY_WITH_PATH', 
        payload: { 
          category: selectedCategory, 
          path: newPath 
        } 
      });
    }
  };

  // Get current level categories for mobile view
  const getCurrentLevelCategories = () => {
    if (categoryPath.length === 0) {
      // Return root categories for mobile when no category is selected
      return allCategories.filter(cat => !cat.parentId);
    }
    
    // For mobile, show children of the last selected category
    const currentParent = categoryPath[categoryPath.length - 1];
    return currentParent.children || [];
  };

  return (
    <div className="bg-white">

      {/* Mobile/Tablet Fixed Header/Breadcrumb */}
      <div className="lg:hidden fixed top-[56px] left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-2">
        {categoryPath.length > 0 ? (
          <BreadcrumbNav 
            categoryPath={categoryPath}
            onCategoryClick={handleBreadcrumbClick}
          />
        ) : (
          <div className="flex items-center space-x-1 text-xs lg:text-sm flex-wrap">
            <span className="text-gray-700">Adım Adım Kategori Seçimi</span>
          </div>
        )}
      </div>
      
      {/* Main content with dynamic padding based on breadcrumb presence */}
      <div className={`${categoryPath.length > 0 ? 'lg:pt-6 pt-[108px]' : 'lg:pt-6 pt-[108px]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:py-3">
          
          {/* Page Title - Only show on desktop */}
          <div className="hidden lg:block mb-6 text-left">
            <h1 className="text-1xl font-medium text-gray-900">Adım Adım Kategori Seçimi</h1>
          </div>

          {/* Desktop Breadcrumb Navigation */}
          {categoryPath.length > 0 && (
            <div className="hidden lg:block mb-6">
              <BreadcrumbNav 
                categoryPath={categoryPath}
                onCategoryClick={handleBreadcrumbClick}
              />
            </div>
          )}

          {/* Category Selection */}
          <>
            {/* Desktop Layout */}
            <div className="hidden lg:block">
              {categoryPath.length === 0 ? (
                /* Root categories - Card layout */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {allCategories.filter(cat => !cat.parentId).map(category => (
                    <div
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      onMouseEnter={() => handleCategoryHover(category)}
                      className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all duration-200 group h-32 flex flex-col justify-center"
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
                    const actualLevelIndex = levelIndex + 1;
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
                                onMouseEnter={() => handleCategoryHover(category)}
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
                  
                  {/* Desktop Completion box */}
                  {categoryPath.length > 0 && !hasChildren(categoryPath[categoryPath.length - 1]) && (
                    <div className="flex-shrink-0 w-60 bg-green-50 border border-green-200 rounded-lg overflow-hidden">
                      <div className="p-4 flex flex-col items-center justify-center h-80 text-center space-y-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-green-800">
                          Kategori Seçimi Tamamlanmıştır.
                        </p>
                        <button
                          onClick={async () => {
                            // Check authentication first
                            if (!isAuthenticated) {
                              navigate('/auth/login');
                              return;
                            }
                            
                            let currentClassifiedId = state.classifiedId || classifiedId;
                            
                            // Create draft only if it doesn't exist
                            if (!currentClassifiedId) {
                              try {
                                const newDraft = await createDraftMutation.mutateAsync({
                                  categoryId: state.selectedCategory?.id || categoryPath[categoryPath.length - 1]?.id || 0,
                                  status: 'draft'
                                });
                                currentClassifiedId = newDraft.id;
                                dispatch({ type: 'SET_CLASSIFIED_ID', payload: newDraft.id });
                                dispatch({ type: 'SET_IS_DRAFT', payload: true });
                              } catch (error) {
                                console.error('Draft oluşturulamadı:', error);
                                return;
                              }
                            }
                            
                            // Update draft with selected category
                            if (currentClassifiedId && state.selectedCategory) {
                              try {
                                await updateDraftMutation.mutateAsync({
                                  id: currentClassifiedId,
                                  data: { categoryId: state.selectedCategory.id }
                                });
                              } catch (error) {
                                console.error('Draft güncellenemedi:', error);
                              }
                            }
                            
                            dispatch({ type: 'SET_STEP', payload: 2 });
                            const url = currentClassifiedId ? 
                              `/create-listing/step-2?classifiedId=${currentClassifiedId}` : 
                              '/create-listing/step-2';
                            navigate(url);
                          }}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          {isAuthenticated ? 'Devam Et' : 'Giriş Yap ve Devam Et'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile/Tablet Layout - Always List Format */}
            <div className="lg:hidden space-y-3">
              {getCurrentLevelCategories().map(category => (
                <div
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  onMouseEnter={() => handleCategoryHover(category)}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4 min-h-[24px]">
                    {category.icon && (
                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                        <img 
                          src={`${window.location.origin}/uploads/category-icons/${category.icon}`}
                          alt={category.name}
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-base">
                        {category.name}
                      </h3>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Mobile Completion */}
              {categoryPath.length > 0 && !hasChildren(categoryPath[categoryPath.length - 1]) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-green-800">
                    Kategori Seçimi Tamamlanmıştır.
                  </p>
                  <button
                    onClick={async () => {
                      // Check authentication first
                      if (!isAuthenticated) {
                        navigate('/auth/login');
                        return;
                      }
                      
                      // Eğer context'te eski bir classifiedId varsa ama o draft silinmişse temizle
                      let currentClassifiedId = state.classifiedId;
                      
                      // Create new draft - her zaman yeni draft oluştur
                      try {
                        const newDraft = await createDraftMutation.mutateAsync({
                          categoryId: state.selectedCategory!.id,
                          title: null,
                          description: null,
                          price: null,
                          customFields: null,
                          photos: null,
                          locationData: null,
                          status: 'draft' as const,
                        });
                        currentClassifiedId = newDraft.id;
                        dispatch({ type: 'SET_CLASSIFIED_ID', payload: newDraft.id });
                        dispatch({ type: 'SET_IS_DRAFT', payload: true });
                      } catch (error) {
                        console.error('Draft oluşturulamadı:', error);
                        return;
                      }
                      
                      dispatch({ type: 'SET_STEP', payload: 2 });
                      const url = `/create-listing/step-2?classifiedId=${currentClassifiedId}`;
                      navigate(url);
                    }}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-base font-medium"
                  >
                    {isAuthenticated ? 'Devam Et' : 'Giriş Yap ve Devam Et'}
                  </button>
                </div>
              )}
            </div>
          </>
        </div>
        
        {/* Performance indicator */}
        <PageLoadIndicator />
      </div>
      </div>
      
      {/* Draft Continue Modal */}
      {currentExistingDraft && (
        <DraftContinueModal
          draft={currentExistingDraft}
          isOpen={showDraftModal}
          onContinue={handleContinueWithDraft}
          onCreateNew={handleCreateNewListing}
          onClose={() => {
            setShowDraftModal(false);
            setCurrentExistingDraft(null);
            setPendingCategory(null);
            setPendingPath([]);
          }}
        />
      )}
    </div>
  );
}
