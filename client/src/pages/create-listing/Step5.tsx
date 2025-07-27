import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useQuery } from "@tanstack/react-query";
import { useAuth } from '@/hooks/useAuth';
import CreateListingLayout from '@/components/CreateListingLayout';
import { PageLoadIndicator } from '@/components/PageLoadIndicator';

interface CategoryPackage {
  id: number;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
}

interface DopingPackage {
  id: number;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
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

export default function Step5() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Get classified ID from URL
  const params = new URLSearchParams(search);
  const currentClassifiedId = params.get('classifiedId');
  
  const [selectedCategoryPackage, setSelectedCategoryPackage] = useState<number | null>(null);
  const [selectedDopingPackages, setSelectedDopingPackages] = useState<number[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

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

  // Fetch doping packages
  const { data: dopingPackages = [], isLoading: isDopingPackagesLoading } = useQuery<DopingPackage[]>({
    queryKey: ['/api/doping-packages'],
    staleTime: 5 * 60 * 1000,
  });

  // Calculate total price
  useEffect(() => {
    let total = 0;
    
    if (selectedCategoryPackage) {
      const pkg = categoryPackages.find((p: CategoryPackage) => p.id === selectedCategoryPackage);
      if (pkg) total += pkg.price;
    }

    selectedDopingPackages.forEach(id => {
      const pkg = dopingPackages.find((p: DopingPackage) => p.id === id);
      if (pkg) total += pkg.price;
    });

    setTotalPrice(total);
  }, [selectedCategoryPackage, selectedDopingPackages, categoryPackages, dopingPackages]);

  const handleCategoryPackageSelect = (packageId: number | null) => {
    setSelectedCategoryPackage(packageId);
  };

  const handleDopingPackageToggle = (packageId: number) => {
    setSelectedDopingPackages(prev => 
      prev.includes(packageId) 
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  };

  const handleBack = () => {
    navigate(`/create-listing/step-4?classifiedId=${currentClassifiedId}`);
  };

  const handleContinue = () => {
    alert('Paket seçimi tamamlandı! Ödeme özelliği yakında eklenecek.');
  };

  if (authLoading || isDraftLoading) {
    return (
      <CreateListingLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC7830] mx-auto mb-4"></div>
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </CreateListingLayout>
    );
  }

  return (
    <CreateListingLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paket Seçimi</h1>
          <p className="text-gray-600">İlanınız için uygun paketleri seçin</p>
        </div>

        <div className="space-y-8">
          {/* Category Packages */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Kategori Paketleri</h2>
            
            {isCategoryPackagesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#EC7830] mx-auto mb-2"></div>
                <p className="text-gray-600">Paketler yükleniyor...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Free Option - Temporarily disabled until inheritance is properly implemented */}

                {/* Paid Category Packages */}
                {categoryPackages.map((pkg: CategoryPackage) => (
                  <div
                    key={pkg.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedCategoryPackage === pkg.id
                        ? 'border-[#EC7830] bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleCategoryPackageSelect(pkg.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                        {pkg.description && (
                          <p className="text-gray-600 text-sm">{pkg.description}</p>
                        )}
                        <p className="text-gray-500 text-sm">Süre: {pkg.durationDays} gün</p>
                      </div>
                      <div>
                        <p className="font-bold text-[#EC7830]">{(pkg.price / 100).toLocaleString('tr-TR')} TL</p>
                      </div>
                    </div>
                  </div>
                ))}

                {categoryPackages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Bu kategori için paket tanımlanmamış</p>
                  </div>
                )}
              </div>
            )}
          </div>

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
                {dopingPackages.map((pkg: DopingPackage) => (
                  <div
                    key={pkg.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedDopingPackages.includes(pkg.id)
                        ? 'border-[#EC7830] bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleDopingPackageToggle(pkg.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                        {pkg.description && (
                          <p className="text-gray-600 text-sm">{pkg.description}</p>
                        )}
                        <p className="text-gray-500 text-sm">Süre: {pkg.durationDays} gün</p>
                      </div>
                      <div>
                        <p className="font-bold text-[#EC7830]">{(pkg.price / 100).toLocaleString('tr-TR')} TL</p>
                      </div>
                    </div>
                  </div>
                ))}

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
    </CreateListingLayout>
  );
}