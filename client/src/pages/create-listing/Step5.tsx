import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useQuery } from "@tanstack/react-query";
import { useAuth } from '@/hooks/useAuth';
import { PageLoadIndicator } from '@/components/PageLoadIndicator';

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
  freeListingLimitIndividual?: number;
  freeListingLimitCorporate?: number;
}

export default function Step5() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Get classified ID from URL
  const params = new URLSearchParams(search);
  const currentClassifiedId = params.get('classifiedId');
  
  const [selectedCategoryPackage, setSelectedCategoryPackage] = useState<number | null>(null);
  const [selectedDopingPackages, setSelectedDopingPackages] = useState<number[]>([]);

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

  // Fetch category packages
  const { data: categoryPackages = [], isLoading: isCategoryPackagesLoading } = useQuery<CategoryPackage[]>({
    queryKey: ['/api/categories', draftListing?.categoryId, 'packages'],
    enabled: !!draftListing?.categoryId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch category details to check free listing limits
  const { data: category } = useQuery<Category>({
    queryKey: ['/api/categories', draftListing?.categoryId],
    enabled: !!draftListing?.categoryId,
    staleTime: 5 * 60 * 1000,
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

  // Calculate total price with useMemo for performance
  const totalPrice = useMemo(() => {
    let total = 0;
    
    if (selectedCategoryPackage) {
      const pkg = categoryPackages.find((p: CategoryPackage) => p.id === selectedCategoryPackage);
      if (pkg) total += pkg.price;
    }

    selectedDopingPackages.forEach(id => {
      const pkg = dopingPackages.find((p: DopingPackage) => p.id === id);
      if (pkg) total += pkg.price;
    });

    return total;
  }, [selectedCategoryPackage, selectedDopingPackages, categoryPackages, dopingPackages]);

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

  const handleContinue = useCallback(() => {
    // TODO: Handle package selection submission
    console.log('Selected packages:', {
      categoryPackage: selectedCategoryPackage,
      dopingPackages: selectedDopingPackages,
      totalPrice
    });
    alert('Paket seçimi tamamlandı! Ödeme özelliği yakında eklenecek.');
  }, [selectedCategoryPackage, selectedDopingPackages, totalPrice]);

  // Check if free listing is available for this category
  const hasFreeListing = useMemo(() => {
    if (!category) return false;
    // Check if either individual or corporate users have free listing limit > 0
    return (category.freeListingLimitIndividual && category.freeListingLimitIndividual > 0) ||
           (category.freeListingLimitCorporate && category.freeListingLimitCorporate > 0);
  }, [category]);

  if (authLoading || isDraftLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC7830] mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      <div className="space-y-8">
        {/* Category Packages - Only show if packages exist or free listing available */}
        {(categoryPackages.length > 0 || hasFreeListing) ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Kategori Paketleri</h2>
            
            {isCategoryPackagesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#EC7830] mx-auto mb-2"></div>
                <p className="text-gray-600">Paketler yükleniyor...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Free option - only show if category has free listing limits */}
                {hasFreeListing && (
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedCategoryPackage === null
                        ? 'border-[#EC7830] bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleCategoryPackageSelect(null)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">Ücretsiz İlan</h3>
                        <p className="text-gray-600 text-sm">Standart ilan özelliklerini kullanın</p>
                      </div>
                      <div>
                        <p className="font-bold text-green-600">Ücretsiz</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Category packages */}
                {categoryPackages.map((pkg: CategoryPackage) => {
                  const features = parseFeatures(pkg.features);
                  return (
                    <div
                      key={pkg.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedCategoryPackage === pkg.id
                          ? 'border-[#EC7830] bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleCategoryPackageSelect(pkg.id)}
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
              </div>
            )}
          </div>
        ) : null}

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
        {totalPrice > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Toplam Tutar</h3>
              <p className="text-2xl font-bold text-[#EC7830]">{(totalPrice / 100).toLocaleString('tr-TR')} TL</p>
            </div>
          </div>
        )}
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
          className="px-6 py-3 bg-[#EC7830] text-white rounded-lg hover:bg-[#d96b2a] transition-colors font-medium"
        >
          Devam Et
        </button>
      </div>

      <PageLoadIndicator />
    </div>
  );
}