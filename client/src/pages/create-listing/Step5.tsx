import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useQuery } from "@tanstack/react-query";
import { useAuth } from '@/hooks/useAuth';
import { useDoubleClickProtection } from '@/hooks/useDoubleClickProtection';
import { PageLoadIndicator } from '@/components/PageLoadIndicator';
import { IOSSpinner } from '@/components/iOSSpinner';
import CreateListingLayout from '@/components/CreateListingLayout';

interface CategoryPackage {
  id: number;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  features?: string; // JSON string of features array
}

interface DopingPackage {
  id: number;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  features?: string; // JSON string of features array
}

interface DraftListing {
  id: number;
  categoryId: number;
  userId: number;
  title?: string;
  description?: string;
  price?: any;
  step1Completed: boolean;
  step2Completed: boolean;
  step3Completed: boolean;
  step4Completed: boolean;
}

interface Category {
  id: number;
  name: string;
  parentId?: number;
  freeListingLimitIndividual?: number;
  freeListingLimitCorporate?: number;
}

export default function Step5() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Get classified ID from URL
  const params = new URLSearchParams(search);
  const currentClassifiedId = params.get('classifiedId');
  
  const [selectedCategoryPackage, setSelectedCategoryPackage] = useState<number | null>(null);
  const [selectedDopingPackages, setSelectedDopingPackages] = useState<number[]>([]);
  
  // DOUBLE-CLICK PROTECTION: Using custom hook
  const { isSubmitting, executeWithProtection } = useDoubleClickProtection();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Redirect if no classified ID
  useEffect(() => {
    if (!currentClassifiedId) {
      navigate('/create-listing/step-1');
    }
  }, [currentClassifiedId, navigate]);

  // Fetch draft listing
  const { data: draftListing, isLoading: isDraftLoading } = useQuery<DraftListing>({
    queryKey: ['/api/draft-listings', currentClassifiedId],
    enabled: !!currentClassifiedId,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch category packages with new system
  const { data: categoryPackages = [], isLoading: isCategoryPackagesLoading } = useQuery<any[]>({
    queryKey: ['/api/categories', draftListing?.categoryId, 'packages'],
    enabled: !!draftListing?.categoryId,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch category details to check free listing limits - FRESH DATA
  const { data: category, refetch: refetchCategory } = useQuery<Category>({
    queryKey: ['/api/categories', draftListing?.categoryId],
    enabled: !!draftListing?.categoryId,
    staleTime: 0, // Always fresh data for admin changes
    refetchInterval: false, // Manual control
  });

  // Fetch doping packages
  const { data: dopingPackages = [], isLoading: isDopingPackagesLoading } = useQuery<DopingPackage[]>({
    queryKey: ['/api/doping-packages'],
    staleTime: 5 * 60 * 1000,
  });

  // Parse features helper function
  const parseFeatures = useCallback((featuresString?: string): string[] => {
    if (!featuresString) return [];
    try {
      return JSON.parse(featuresString);
    } catch {
      return [];
    }
  }, []);

  // Parse membership types helper function
  const parseMembershipTypes = useCallback((membershipTypesString?: string): string[] => {
    if (!membershipTypesString) return ["individual", "corporate"];
    try {
      return JSON.parse(membershipTypesString);
    } catch {
      return ["individual", "corporate"];
    }
  }, []);

  // Filter packages for current user membership type
  const availablePackages = useMemo(() => {
    if (!authUser) return [];
    
    return categoryPackages.filter(pkg => {
      const membershipTypes = parseMembershipTypes(pkg.membershipTypes);
      return membershipTypes.includes(authUser.role);
    });
  }, [categoryPackages, authUser, parseMembershipTypes]);

  // Check if user has free listing quota for selected package
  const getPackageDisplayPrice = useCallback((pkg: any) => {
    if (!authUser) return { price: pkg.price, isFree: false };
    
    const userRole = authUser.role;
    const hasFreeQuota = userRole === 'individual' 
      ? (pkg.freeListingLimitIndividual || 0) > 0
      : (pkg.freeListingLimitCorporate || 0) > 0;

    return {
      price: hasFreeQuota ? 0 : pkg.price,
      originalPrice: pkg.price,
      isFree: hasFreeQuota,
      freeText: pkg.freeListingPriceText || '0 TL'
    };
  }, [authUser]);

  // Calculate total price with useMemo for performance
  const totalPrice = useMemo(() => {
    let total = 0;
    
    if (selectedCategoryPackage) {
      const pkg = availablePackages.find((p: any) => p.id === selectedCategoryPackage);
      if (pkg) {
        const displayPrice = getPackageDisplayPrice(pkg);
        total += displayPrice.price;
      }
    }

    selectedDopingPackages.forEach(id => {
      const pkg = dopingPackages.find((p: DopingPackage) => p.id === id);
      if (pkg) total += (pkg.price / 100);
    });

    return total;
  }, [selectedCategoryPackage, selectedDopingPackages, availablePackages, dopingPackages, getPackageDisplayPrice]);

  const handleCategoryPackageSelect = useCallback((packageId: number | null) => {
    setSelectedCategoryPackage(packageId);
  }, []);

  const handleDopingPackageToggle = useCallback((packageId: number) => {
    setSelectedDopingPackages(prev => 
      prev.includes(packageId) 
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  }, []);

  const handleBack = useCallback(() => {
    navigate(`/create-listing/step-4?classifiedId=${currentClassifiedId}`);
  }, [navigate, currentClassifiedId]);

  const handleContinue = useCallback(async () => {
    await executeWithProtection(async () => {
      // Package selection completed - ready for payment integration
      const selectedPackages = {
        categoryPackage: selectedCategoryPackage,
        dopingPackages: selectedDopingPackages,
        totalPrice
      };
      
      // Future: Integrate with Stripe payment system
      alert('Paket seçimi tamamlandı! Ödeme özelliği yakında eklenecek.');
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
    });
  }, [selectedCategoryPackage, selectedDopingPackages, totalPrice, executeWithProtection]);

  // Fetch all categories in flat structure to check for inheritance - FRESH DATA
  const { data: allCategories = [], refetch: refetchCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories/flat'],
    staleTime: 0, // Always fresh data for admin changes
    refetchInterval: false, // Manual control
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Check if free listing is available for this category with inheritance
  const hasFreeListing = useMemo(() => {
    if (!category || !allCategories.length || !authUser) {
      console.log(`🚫 hasFreeListing: Missing data - category: ${!!category}, allCategories: ${allCategories.length}, authUser: ${!!authUser}`);
      return false;
    }
    
    console.log(`🔍 FREE LISTING CHECK for category: ${category.name} (ID: ${category.id}), user: ${authUser.role} (${authUser.email})`);
    
    // Build hierarchy path from current category to root
    const getHierarchyPath = (categoryId: number): Category[] => {
      const path: Category[] = [];
      let currentCat = allCategories.find(c => c.id === categoryId);
      
      while (currentCat) {
        path.push(currentCat);
        if (!currentCat.parentId) break;
        currentCat = allCategories.find(c => c.id === currentCat!.parentId);
      }
      
      return path;
    };
    
    const hierarchyPath = getHierarchyPath(category.id);
    const isIndividual = authUser.role === 'individual';
    const isCorporate = authUser.role === 'corporate';
    
    console.log(`📊 Category hierarchy (${hierarchyPath.length} levels):`, hierarchyPath.map(c => `${c.name} (${c.id}): ind=${c.freeListingLimitIndividual}, corp=${c.freeListingLimitCorporate}`));
    console.log(`🎯 USER ROLE CHECK: Looking for ${isIndividual ? 'INDIVIDUAL' : 'CORPORATE'} limits`);
    
    // Check each category in hierarchy for free listing limits based on user role
    for (const cat of hierarchyPath) {
      console.log(`🔎 Checking ${cat.name}: individual=${cat.freeListingLimitIndividual}, corporate=${cat.freeListingLimitCorporate}`);
      
      if (isIndividual && cat.freeListingLimitIndividual && cat.freeListingLimitIndividual > 0) {
        console.log(`✅ FREE LISTING FOUND: ${cat.name} has individual limit: ${cat.freeListingLimitIndividual}`);
        return true;
      }
      if (isCorporate && cat.freeListingLimitCorporate && cat.freeListingLimitCorporate > 0) {
        console.log(`✅ FREE LISTING FOUND: ${cat.name} has corporate limit: ${cat.freeListingLimitCorporate}`);
        return true;
      }
      
      console.log(`❌ No ${isIndividual ? 'individual' : 'corporate'} limit in ${cat.name}`);
    }
    
    console.log(`❌ NO FREE LISTING: No category in hierarchy has limits for ${authUser.role} users`);
    console.log(`🎯 FINAL RESULT: hasFreeListing = FALSE (System working correctly)`);
    return false;
  }, [category, allCategories, authUser]);

  // Force refetch categories when coming to Step5 to ensure fresh data
  useEffect(() => {
    console.log(`🔄 Step5 mounted - forcing categories refetch`);
    refetchCategories();
    
    // Also clear any cached categories data on mount
    if (typeof window !== 'undefined' && (window as any).queryClient) {
      const queryClient = (window as any).queryClient;
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories/flat'] });
      console.log('🔄 STEP5: Cleared all category caches on mount');
    }
  }, [refetchCategories]);

  // Get free listing text content from category hierarchy
  const freeListingContent = useMemo(() => {
    if (!category || !allCategories.length) {
      return {
        title: "Ücretsiz İlan",
        description: "Standart ilan özelliklerini kullanın",
        priceText: "Ücretsiz"
      };
    }

    // Build hierarchy path from current category to root
    const getHierarchyPath = (categoryId: number): Category[] => {
      const path: Category[] = [];
      let currentCat = allCategories.find(c => c.id === categoryId);
      
      while (currentCat) {
        path.push(currentCat);
        if (!currentCat.parentId) break;
        currentCat = allCategories.find(c => c.id === currentCat!.parentId);
      }
      
      return path;
    };
    
    const hierarchyPath = getHierarchyPath(category.id);
    
    // Find the first category in hierarchy that has NON-DEFAULT text content defined
    for (const cat of hierarchyPath) {
      const catAny = cat as any;
      console.log(`🔍 Checking category ${cat.name} (ID: ${cat.id}) for text content:`, {
        title: catAny.freeListingTitle,
        description: catAny.freeListingDescription,
        priceText: catAny.freeListingPriceText
      });
      
      // Only use if text content is different from defaults (inheritance-based)
      const hasCustomTitle = catAny.freeListingTitle && catAny.freeListingTitle !== "Ücretsiz İlan";
      const hasCustomDescription = catAny.freeListingDescription && catAny.freeListingDescription !== "Standart ilan özelliklerini kullanın";
      const hasCustomPriceText = catAny.freeListingPriceText && catAny.freeListingPriceText !== "Ücretsiz";
      
      if (hasCustomTitle || hasCustomDescription || hasCustomPriceText) {
        const content = {
          title: catAny.freeListingTitle || "Ücretsiz İlan",
          description: catAny.freeListingDescription || "Standart ilan özelliklerini kullanın",
          priceText: catAny.freeListingPriceText || "Ücretsiz"
        };
        console.log(`✅ Using CUSTOM text content from ${cat.name}:`, content);
        return content;
      }
    }
    
    // Fallback to defaults
    return {
      title: "Ücretsiz İlan",
      description: "Standart ilan özelliklerini kullanın",
      priceText: "Ücretsiz"
    };
  }, [category, allCategories]);

  if (authLoading || isDraftLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IOSSpinner />
      </div>
    );
  }

  return (
    <CreateListingLayout stepNumber={5}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:py-4">
        
        {/* Mobile/Tablet Header - Boş alan navbar için */}
        <div className="lg:hidden mt-[56px] mb-4"></div>

        <div className="space-y-8">
        {/* Category Packages - New System */}
        {availablePackages.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">İlan Paketleri</h2>
            
            {isCategoryPackagesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#EC7830] mx-auto mb-2"></div>
                <p className="text-gray-600">Paketler yükleniyor...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availablePackages.map((pkg: any) => {
                  const features = parseFeatures(pkg.features);
                  const isSelected = selectedCategoryPackage === pkg.id;
                  const displayPrice = getPackageDisplayPrice(pkg);
                  
                  return (
                    <div
                      key={pkg.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-[#EC7830] bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleCategoryPackageSelect(pkg.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {displayPrice.isFree ? (pkg.freeListingTitle || pkg.name) : pkg.name}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {displayPrice.isFree ? (pkg.freeListingDescription || pkg.description) : pkg.description}
                          </p>
                          <p className="text-gray-500 text-sm mt-1">Süre: {pkg.durationDays} gün</p>
                          {features.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700 mb-1">Özellikler:</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {features.map((feature, index) => (
                                  <li key={index} className="flex items-center">
                                    <span className="w-1.5 h-1.5 bg-[#EC7830] rounded-full mr-2"></span>
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          {displayPrice.isFree ? (
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                {displayPrice.freeText}
                              </div>
                              <div className="text-sm text-gray-500 line-through">
                                {displayPrice.originalPrice} TL
                              </div>
                            </div>
                          ) : (
                            <p className="font-bold text-[#EC7830]">
                              {pkg.price === 0 ? 'Ücretsiz' : `${pkg.price} TL`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Doping Packages */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Doping Paketleri</h2>
          
          {isDopingPackagesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#EC7830] mx-auto mb-2"></div>
              <p className="text-gray-600">Doping paketleri yükleniyor...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dopingPackages.map((pkg: DopingPackage) => {
                const features = parseFeatures(pkg.features);
                return (
                  <div
                    key={pkg.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedDopingPackages.includes(pkg.id)
                        ? 'border-[#EC7830] bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleDopingPackageToggle(pkg.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                        {pkg.description && (
                          <p className="text-gray-600 text-sm mt-1">{pkg.description}</p>
                        )}
                        <p className="text-gray-500 text-sm mt-1">Süre: {pkg.durationDays} gün</p>
                        {features.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">Özellikler:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {features.map((feature, index) => (
                                <li key={index} className="flex items-center">
                                  <span className="w-1.5 h-1.5 bg-[#EC7830] rounded-full mr-2"></span>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <p className="font-bold text-[#EC7830]">{(pkg.price / 100).toLocaleString('tr-TR')} TL</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {dopingPackages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Doping paketi tanımlanmamış</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Total Price */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Toplam Tutar</h3>
            <p className="text-2xl font-bold text-[#EC7830]">{totalPrice.toLocaleString('tr-TR')} TL</p>
          </div>
        </div>
      </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={handleBack}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Önceki Adım
          </button>

          <button
            onClick={handleContinue}
            disabled={isSubmitting || !selectedCategoryPackage}
            className={`px-6 py-3 rounded-lg transition-colors font-medium ${
              isSubmitting || !selectedCategoryPackage
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-[#EC7830] text-white hover:bg-[#d96b2a]'
            }`}
          >
            {isSubmitting ? 'İşleniyor...' : 'İlanı Yayınla'}
          </button>
        </div>

        <PageLoadIndicator />
      </div>
    </CreateListingLayout>
  );
}