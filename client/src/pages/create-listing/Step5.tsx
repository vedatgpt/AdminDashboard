import { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useQuery } from "@tanstack/react-query";
import { useAuth } from '@/hooks/useAuth';
import { useDoubleClickProtection } from '@/hooks/useDoubleClickProtection';
import { PageLoadIndicator } from '@/components/PageLoadIndicator';

interface CategoryPackage {
  id: number;
  categoryId: number;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  features: string; // JSON string of features array
  membershipTypes: string; // JSON string of membership types
  isActive: boolean;
  applyToSubcategories?: boolean;
  freeListingLimitIndividual?: number;
  freeListingLimitCorporate?: number;
  freeResetPeriodIndividual?: string;
  freeResetPeriodCorporate?: string;
  freeListingTitle?: string;
  freeListingDescription?: string;
  freeListingPriceText?: string;
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
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Get classified ID from URL
  const params = new URLSearchParams(search);
  const currentClassifiedId = params.get('classifiedId');
  
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  
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

  // Fetch draft listing data
  const { data: draftListing, isLoading: draftLoading } = useQuery<DraftListing>({
    queryKey: ['/api/draft-listings', currentClassifiedId],
    enabled: !!currentClassifiedId && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch category packages
  const { data: packages = [], isLoading: packagesLoading } = useQuery<CategoryPackage[]>({
    queryKey: ['/api/categories', draftListing?.categoryId, 'packages'],
    enabled: !!draftListing?.categoryId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Parse JSON fields
  const parseFeatures = (features: string): string[] => {
    try {
      return JSON.parse(features);
    } catch {
      return [];
    }
  };

  const parseMembershipTypes = (membershipTypes: string): string[] => {
    try {
      return JSON.parse(membershipTypes);
    } catch {
      return ["individual", "corporate"];
    }
  };

  // Check if user has free listing quota for a package
  const hasFreeListing = useMemo(() => {
    if (!authUser || !selectedPackageId) return false;
    
    const selectedPackage = packages.find(pkg => pkg.id === selectedPackageId);
    if (!selectedPackage) return false;

    const userRole = authUser.role;
    
    if (userRole === 'individual') {
      return (selectedPackage.freeListingLimitIndividual || 0) > 0;
    } else if (userRole === 'corporate') {
      return (selectedPackage.freeListingLimitCorporate || 0) > 0;
    }
    
    return false;
  }, [authUser, selectedPackageId, packages]);

  // Filter packages for current user membership type
  const availablePackages = useMemo(() => {
    if (!authUser) return [];
    
    return packages.filter(pkg => {
      const membershipTypes = parseMembershipTypes(pkg.membershipTypes);
      return membershipTypes.includes(authUser.role);
    });
  }, [packages, authUser]);

  // Handle package selection
  const handlePackageSelect = (packageId: number) => {
    setSelectedPackageId(packageId);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedPackageId || !currentClassifiedId) return;

    await executeWithProtection(async () => {
      // TODO: Implement package selection save logic
      console.log('Selected package:', selectedPackageId);
      console.log('Has free listing:', hasFreeListing);
      
      // For now, just navigate to success page or next step
      navigate('/'); // Navigate to main page for now
    });
  };

  // Loading states
  if (authLoading || draftLoading) {
    return <PageLoadIndicator />;
  }

  if (!isAuthenticated || !draftListing) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageLoadIndicator />
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">İlan Paketini Seçin</h1>
            <p className="mt-2 text-gray-600">İlanınız için uygun paketi seçerek yayınlayın</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {packagesLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC7830]"></div>
            <p className="mt-4 text-gray-600">Paketler yükleniyor...</p>
          </div>
        ) : availablePackages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Bu kategori için henüz paket tanımlanmamış.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Package Selection */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availablePackages.map((pkg) => {
                const features = parseFeatures(pkg.features);
                const isSelected = selectedPackageId === pkg.id;
                const userRole = authUser?.role;
                
                // Check if user has free listing for this package
                const hasFreeQuota = userRole === 'individual' 
                  ? (pkg.freeListingLimitIndividual || 0) > 0
                  : (pkg.freeListingLimitCorporate || 0) > 0;

                const showFreePrice = hasFreeQuota && isSelected;

                return (
                  <div
                    key={pkg.id}
                    className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#EC7830] bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => handlePackageSelect(pkg.id)}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 bg-[#EC7830] rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Package content */}
                    <div className="space-y-4">
                      {/* Package name */}
                      <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>

                      {/* Package description */}
                      {pkg.description && (
                        <p className="text-sm text-gray-600">{pkg.description}</p>
                      )}

                      {/* Price section */}
                      <div className="space-y-2">
                        {showFreePrice ? (
                          <div className="space-y-1">
                            {/* Free price display */}
                            <div className="text-2xl font-bold text-green-600">
                              {pkg.freeListingPriceText || '0 TL'}
                            </div>
                            {/* Original price crossed out */}
                            <div className="text-sm text-gray-500 line-through">
                              {pkg.price} TL
                            </div>
                            <div className="text-xs text-green-600 font-medium">
                              Ücretsiz ilan hakkınız mevcut
                            </div>
                          </div>
                        ) : (
                          <div className="text-2xl font-bold text-gray-900">
                            {pkg.price === 0 ? 'Ücretsiz' : `${pkg.price} TL`}
                          </div>
                        )}
                        
                        {/* Duration */}
                        <div className="text-sm text-gray-600">
                          {pkg.durationDays} gün süreyle aktif
                        </div>
                      </div>

                      {/* Features */}
                      {features.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-900">Paket Özellikleri:</h4>
                          <ul className="space-y-1">
                            {features.map((feature, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-center">
                                <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex justify-between pt-8">
              <button
                type="button"
                onClick={() => navigate(`/create-listing/step-4?classifiedId=${currentClassifiedId}`)}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Önceki Adım
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedPackageId || isSubmitting}
                className={`px-8 py-3 text-sm font-medium text-white rounded-md ${
                  !selectedPackageId || isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#EC7830] hover:bg-[#d96b2a]'
                }`}
              >
                {isSubmitting ? 'İşleniyor...' : 'İlanı Yayınla'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}