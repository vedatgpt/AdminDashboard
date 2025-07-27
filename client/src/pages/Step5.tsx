import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useDraftListing } from "../hooks/useDraftListing";
import { useStepGuard } from "../hooks/useStepGuard";
import { useClassifiedId } from "../hooks/useClassifiedId";
import CreateListingLayout from "../components/CreateListingLayout";
import { PageLoadIndicator } from "../components/PageLoadIndicator";

interface CategoryPackage {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  features: string[];
  membershipTypes: string[];
  isActive: boolean;
  sortOrder: number;
}

interface DopingPackage {
  id: number;
  name: string;
  description: string;
  price: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

export default function Step5() {
  const [, setLocation] = useLocation();
  const classifiedId = useClassifiedId();
  const [selectedCategoryPackage, setSelectedCategoryPackage] = useState<number | null>(null);
  const [selectedDopingPackages, setSelectedDopingPackages] = useState<number[]>([]);
  const [currentSection, setCurrentSection] = useState<'category' | 'doping'>('category');
  
  // Step guard - ensure previous steps are completed (simplified for now)
  const guardLoading = false;
  
  // Get draft listing data
  const { data: draftListing, isLoading: draftLoading } = useDraftListing(classifiedId);
  
  // Get category packages
  const { data: categoryPackages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['/api/categories', draftListing?.categoryId, 'packages'],
    enabled: !!draftListing?.categoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Get doping packages
  const { data: dopingPackages = [], isLoading: dopingLoading } = useQuery({
    queryKey: ['/api/doping-packages'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Handle step guard redirect - disabled for now
  // useEffect(() => {
  //   if (!guardLoading && shouldRedirect && redirectPath) {
  //     setLocation(redirectPath);
  //   }
  // }, [guardLoading, shouldRedirect, redirectPath, setLocation]);

  const handleCategoryPackageSelect = (packageId: number) => {
    setSelectedCategoryPackage(packageId);
    setCurrentSection('doping');
  };

  const handleDopingPackageToggle = (packageId: number) => {
    setSelectedDopingPackages(prev => 
      prev.includes(packageId) 
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  };

  const handleBack = () => {
    if (currentSection === 'doping') {
      setCurrentSection('category');
    } else {
      setLocation(`/create-listing/step-4?classifiedId=${classifiedId}`);
    }
  };

  const handleNext = () => {
    // TODO: Save selected packages to draft and proceed to step 6
    console.log('Selected Category Package:', selectedCategoryPackage);
    console.log('Selected Doping Packages:', selectedDopingPackages);
    // setLocation(`/create-listing/step-6?classifiedId=${classifiedId}`);
  };

  const calculateTotalPrice = () => {
    let total = 0;
    
    if (selectedCategoryPackage) {
      const categoryPackage = (categoryPackages as CategoryPackage[]).find((pkg: CategoryPackage) => pkg.id === selectedCategoryPackage);
      if (categoryPackage) total += categoryPackage.price;
    }
    
    selectedDopingPackages.forEach(packageId => {
      const dopingPackage = (dopingPackages as DopingPackage[]).find((pkg: DopingPackage) => pkg.id === packageId);
      if (dopingPackage) total += dopingPackage.price;
    });
    
    return total;
  };

  if (guardLoading || draftLoading) {
    return (
      <CreateListingLayout 
        stepNumber={5}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EC7830] mx-auto mb-4"></div>
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </CreateListingLayout>
    );
  }

  return (
    <CreateListingLayout 
      stepNumber={5}
    >
      <PageLoadIndicator />
      
      <div className="max-w-4xl mx-auto">
        {/* Page Title */}
        <div className="hidden lg:block mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Paket Seçimi</h1>
          <p className="text-gray-600 mt-2">İlanınız için uygun paketi seçin</p>
        </div>

        {/* Section Navigation */}
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCurrentSection('category')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                currentSection === 'category'
                  ? 'bg-white text-[#EC7830] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              İlan Paketi
            </button>
            <button
              onClick={() => setCurrentSection('doping')}
              disabled={!selectedCategoryPackage}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                currentSection === 'doping'
                  ? 'bg-white text-[#EC7830] shadow-sm'
                  : selectedCategoryPackage 
                    ? 'text-gray-600 hover:text-gray-900'
                    : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              Doping
            </button>
          </div>
        </div>

        {/* Category Packages Section */}
        {currentSection === 'category' && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">İlan Paketi Seçin</h2>
            
            {packagesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC7830] mx-auto mb-4"></div>
                <p className="text-gray-600">Paketler yükleniyor...</p>
              </div>
            ) : (categoryPackages as CategoryPackage[]).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Bu kategori için henüz paket tanımlanmamış.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(categoryPackages as CategoryPackage[]).map((pkg: CategoryPackage) => (
                  <div
                    key={pkg.id}
                    onClick={() => handleCategoryPackageSelect(pkg.id)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedCategoryPackage === pkg.id
                        ? 'border-[#EC7830] bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{pkg.name}</h3>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-[#EC7830]">
                          {pkg.price} TL
                        </div>
                        <div className="text-xs text-gray-500">
                          {pkg.durationDays} gün
                        </div>
                      </div>
                    </div>
                    
                    {pkg.description && (
                      <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                    )}
                    
                    <ul className="text-sm text-gray-600 space-y-1">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-[#EC7830] mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    {selectedCategoryPackage === pkg.id && (
                      <div className="mt-3 flex items-center text-sm text-[#EC7830]">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Seçildi
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Doping Packages Section */}
        {currentSection === 'doping' && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Doping Seçin (İsteğe Bağlı)</h2>
            
            {dopingLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC7830] mx-auto mb-4"></div>
                <p className="text-gray-600">Doping paketleri yükleniyor...</p>
              </div>
            ) : (dopingPackages as DopingPackage[]).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Henüz doping paketi tanımlanmamış.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(dopingPackages as DopingPackage[]).map((pkg: DopingPackage) => (
                  <div
                    key={pkg.id}
                    onClick={() => handleDopingPackageToggle(pkg.id)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedDopingPackages.includes(pkg.id)
                        ? 'border-[#EC7830] bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{pkg.name}</h3>
                      <div className="text-lg font-semibold text-[#EC7830]">
                        {pkg.price} TL
                      </div>
                    </div>
                    
                    {pkg.description && (
                      <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                    )}
                    
                    <ul className="text-sm text-gray-600 space-y-1">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-[#EC7830] mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    {selectedDopingPackages.includes(pkg.id) && (
                      <div className="mt-3 flex items-center text-sm text-[#EC7830]">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Seçildi
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Total Price Summary */}
            {(selectedCategoryPackage || selectedDopingPackages.length > 0) && (
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <h3 className="font-medium text-gray-900 mb-3">Seçim Özeti</h3>
                <div className="space-y-2 text-sm">
                  {selectedCategoryPackage && (
                    <div className="flex justify-between">
                      <span>İlan Paketi</span>
                      <span>{(categoryPackages as CategoryPackage[]).find((pkg: CategoryPackage) => pkg.id === selectedCategoryPackage)?.price} TL</span>
                    </div>
                  )}
                  {selectedDopingPackages.map(packageId => {
                    const pkg = (dopingPackages as DopingPackage[]).find((p: DopingPackage) => p.id === packageId);
                    return pkg ? (
                      <div key={packageId} className="flex justify-between">
                        <span>{pkg.name}</span>
                        <span>{pkg.price} TL</span>
                      </div>
                    ) : null;
                  })}
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Toplam</span>
                    <span className="text-[#EC7830]">{calculateTotalPrice()} TL</span>
                  </div>
                </div>
              </div>
            )}

            {/* Continue Button */}
            <div className="flex justify-end pt-6">
              <button
                onClick={handleNext}
                disabled={!selectedCategoryPackage}
                className="px-6 py-2 bg-[#EC7830] text-white rounded-md hover:bg-[#d96b2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Devam Et
              </button>
            </div>
          </div>
        )}
      </div>
    </CreateListingLayout>
  );
}