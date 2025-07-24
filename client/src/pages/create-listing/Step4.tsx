import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from '@/hooks/useAuth';
import { useListing } from '../../contexts/ListingContext';
import { useDraftListing } from '@/hooks/useDraftListing';
import { useCategoriesTree } from '@/hooks/useCategories';
import { useLocationsTree } from '@/hooks/useLocations';
import { useLocationSettings } from '@/hooks/useLocationSettings';
import { useCategoryCustomFields } from '@/hooks/useCustomFields';
import { useToast } from "@/hooks/use-toast";
import CreateListingLayout from '@/components/CreateListingLayout';
import { PageLoadIndicator } from '@/components/PageLoadIndicator';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';

export default function Step4() {
  const { state } = useListing();
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
  const [currentThumbnailPage, setCurrentThumbnailPage] = useState(0);
  const [mainSlideIndex, setMainSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'description'>('details');
  const thumbnailsPerPage = 10;
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [authLoading, isAuthenticated]);

  // URL parameter support
  const urlParams = new URLSearchParams(window.location.search);
  const classifiedIdParam = urlParams.get('classifiedId');
  const currentClassifiedId = state.classifiedId || (classifiedIdParam ? parseInt(classifiedIdParam) : undefined);

  // Draft listing data with cache bypass for immediate updates
  const { data: draftData, refetch: refetchDraft } = useQuery({
    queryKey: ['/api/draft-listings', currentClassifiedId],
    queryFn: async () => {
      if (!currentClassifiedId) return null;
      const response = await fetch(`/api/draft-listings/${currentClassifiedId}?t=${Date.now()}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        if (response.status === 401) {
          throw new Error('Giriş yapmamış kullanıcılar ilan taslağına erişemez');
        }
        if (response.status === 403) {
          throw new Error('Bu ilan taslağına erişim yetkiniz yok');
        }
        throw new Error('İlan taslağı alınamadı');
      }
      return response.json();
    },
    enabled: !!currentClassifiedId,
    staleTime: 0, // No cache for immediate updates
    gcTime: 0, // No cache for immediate updates
  });
  const { data: categories } = useCategoriesTree();
  const { data: locations } = useLocationsTree();
  const { data: locationSettings } = useLocationSettings();
  const { user } = useAuth();

  // Photos state - real-time güncellemesi için
  const [photosState, setPhotosState] = useState<any[]>([]);

  // Draft data değiştiğinde photos state'ini güncelle
  useEffect(() => {
    if (draftData?.photos) {
      try {
        const parsedPhotos = JSON.parse(draftData.photos as string);
        if (Array.isArray(parsedPhotos)) {
          // Order'a göre sırala
          const sortedPhotos = parsedPhotos.sort((a, b) => (a.order || 0) - (b.order || 0));
          setPhotosState(sortedPhotos);
          console.log('Step4 - Photos updated:', sortedPhotos.map(p => ({ id: p.id, order: p.order })));
        }
      } catch (error) {
        console.error('Photos parse error:', error);
        setPhotosState([]);
      }
    } else {
      setPhotosState([]);
    }
  }, [draftData?.photos]);

  // Step-3'ten geldiğinde draft'ı yeniden fetch et
  useEffect(() => {
    if (currentClassifiedId) {
      // Clear any existing cache for this query
      queryClient.removeQueries({ queryKey: ['/api/draft-listings', currentClassifiedId] });
      queryClient.invalidateQueries({ queryKey: ['/api/draft-listings', currentClassifiedId] });

      // Force refetch immediately
      refetchDraft();

      // Additional refetch after a short delay to ensure latest data
      const timeoutId = setTimeout(() => {
        refetchDraft();
      }, 50);

      // Third refetch to be absolutely sure
      const timeoutId2 = setTimeout(() => {
        refetchDraft();
      }, 150);

      // Fourth refetch for maximum certainty
      const timeoutId3 = setTimeout(() => {
        refetchDraft();
      }, 500);

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(timeoutId2);
        clearTimeout(timeoutId3);
      };
    }
  }, [currentClassifiedId, refetchDraft, queryClient]);

  // Get custom fields for the category
  const { data: customFieldsSchema = [] } = useCategoryCustomFields(draftData?.categoryId || 0);

  if (!currentClassifiedId) {
    return (
      <CreateListingLayout stepNumber={4}>
        <div className="text-center py-12">
          <p className="text-gray-500">İlan bulunamadı. Lütfen Step-1'den başlayın.</p>
        </div>
      </CreateListingLayout>
    );
  }

  if (!draftData) {
    return (
      <CreateListingLayout stepNumber={4}>
        <div className="text-center py-12">
          <p className="text-gray-500">Yükleniyor...</p>
        </div>
      </CreateListingLayout>
    );
  }

  // Parse data
  const customFields = draftData.customFields ? JSON.parse(draftData.customFields) : {};
  const locationData = draftData.locationData ? JSON.parse(draftData.locationData) : {};

  // Tarih formatlama fonksiyonu
  const formatDate = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long'
    });
  };

  // Photos artık photosState'ten geliyor

  // Remove debug log - no longer needed

  // Find category details
  const findCategory = (categoryId: number | null) => {
    if (!categories || !categoryId) return null;
    const findInCategories = (cats: any[]): any => {
      for (const cat of cats) {
        if (cat.id === categoryId) return cat;
        if (cat.children) {
          const found = findInCategories(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findInCategories(categories);
  };

  const category = findCategory(draftData.categoryId);

  // Get category path
  const getCategoryPath = (categoryId: number | null) => {
    if (!categories || !categoryId) return [];
    const path: any[] = [];

    const findPath = (cats: any[], targetId: number): boolean => {
      for (const cat of cats) {
        path.push(cat);
        if (cat.id === targetId) return true;
        if (cat.children && findPath(cat.children, targetId)) return true;
        path.pop();
      }
      return false;
    };

    findPath(categories, categoryId);
    return path;
  };

  const categoryPath = getCategoryPath(draftData.categoryId);

  return (
    <CreateListingLayout stepNumber={4}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:py-4">

        {/* Mobile/Tablet Header - Başlık */}
        <div className="lg:hidden bg-white sm:px-8 md:px-10 lg:px-10 py-1 mt-[56px]">
          <h1 className="text-base font-normal text-gray-900 text-center overflow-hidden whitespace-normal max-w-full">
            {customFields.title || 'İlan Başlığı Girilmedi'}
          </h1>
        </div>

        {/* Desktop Başlık */}
        <div className="hidden lg:block mb-4">
          <h1 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
            {customFields.title || 'İlan Başlığı Girilmedi'}
          </h1>
        </div>

                          {/* Ana İçerik - 8 Sütunlu Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-8 gap-3 lg:gap-6 mb-6 lg:pt-0">

                    {/* Sol Sütun - Fotoğraf Galerisi (%50) */}
          <div className="lg:col-span-4 -mx-4 sm:-mx-6 lg:mx-0">
            {photosState.length > 0 ? (
              <div className="overflow-hidden">
                {/* Ana Swiper */}
                <div className="relative">
                  <Swiper
                  onSwiper={setMainSwiper}
                  modules={[Navigation, Pagination, Thumbs]}
                  navigation={false}
                  pagination={false}
                  thumbs={{ swiper: thumbsSwiper }}
                  allowTouchMove={true}
                  simulateTouch={true}
                  speed={250}
                  onSlideChange={(swiper) => {
                    const index = swiper.params.loop ? swiper.realIndex : swiper.activeIndex;
                    setMainSlideIndex(index);

                    // Thumbnails sayfa geçişi
                    if (photosState.length > thumbnailsPerPage) {
                      const targetPage = Math.floor(index / thumbnailsPerPage);
                      setCurrentThumbnailPage(targetPage);
                    }
                  }}
                  className="w-full aspect-[4/2] lg:aspect-[4/3] overflow-hidden"
                >
                  {photosState
                    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                    .map((photo: any, index: number) => (
                      <SwiperSlide key={photo.id || index}>
                        <div 
                          className="w-full h-full bg-white overflow-hidden lg:cursor-pointer"
                          onClick={() => {
                            // Sadece masaüstü cihazlarda çalışsın
                            if (window.innerWidth >= 1024) { // lg breakpoint
                              // Bir sonraki fotoğrafa geç
                              const nextIndex = (index + 1) % photosState.length;
                              if (mainSwiper) {
                                mainSwiper.slideTo(nextIndex, 0, false); // false = animasyon yok
                              }
                            }
                          }}
                          onTouchStart={(e) => {
                            // Mobil cihazlarda touch event'ini engelleme
                            if (window.innerWidth < 1024) {
                              e.stopPropagation();
                            }
                          }}
                        >
                          <img
                            src={photo.url}
                            alt={`Fotoğraf ${index + 1}`}
                            className="w-full h-full object-contain lg:object-contain object-cover pointer-events-none select-none"
                            draggable="false"
                          />
                        </div>
                      </SwiperSlide>
                                          ))}
                  </Swiper>

                  {/* Fotoğraf Sayısı Badge */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white px-2 py-0.5 rounded-full text-xs font-normal z-20 shadow-lg">
                    {mainSlideIndex + 1}/{photosState.length}
                  </div>
                </div>

                                  {/* Büyük Fotoğraf Butonu - Masaüstü için */}
                  <div className="hidden lg:block">
                    <button className="w-full py-2 px-4 bg-gradient-to-b from-white to-gray-100 text-gray-700 text-sm font-medium group">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="11" cy="11" r="8"/>
                          <path d="m21 21-4.35-4.35"/>
                        </svg>
                        <span className="group-hover:underline">Büyük Fotoğraf</span>
                      </div>
                    </button>
                  </div>

                  {/* Thumbnail Grid - Masaüstü için */}
                  {photosState.length > 1 && (
                  <div className="hidden lg:block border border-gray-200 bg-white p-2  flex flex-col justify-between">
                    {/* Thumbnails Grid */}
                    <div className="grid grid-cols-5 gap-1 justify-items-center flex-1">
                      {photosState
                        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                        .slice(currentThumbnailPage * thumbnailsPerPage, (currentThumbnailPage + 1) * thumbnailsPerPage)
                        .map((photo: any, index: number) => {
                          const actualIndex = currentThumbnailPage * thumbnailsPerPage + index;
                          return (
                            <div 
                              key={photo.id || actualIndex}
                              className={`bg-gray-200 overflow-hidden cursor-pointer aspect-[4/3] ${
                                mainSlideIndex === actualIndex 
                                  ? 'ring-1 ring-orange-500' 
                                  : ''
                              }`}
                              onClick={() => {
                                if (mainSwiper) {
                                  mainSwiper.slideTo(actualIndex, 0, false); // false = animasyon yok
                                }
                              }}
                            >
                              <img
                                src={photo.thumbnail || photo.url}
                                alt={`Küçük ${actualIndex + 1}`}
                                className="w-full h-full object-cover select-none"
                                draggable="false"
                              />
                            </div>
                          );
                        })}
                    </div>

                    {/* Sayfalama Noktaları */}
                    {photosState.length > thumbnailsPerPage && (
                      <div className="flex items-center justify-center gap-1 pt-2">
                        {Array.from({ length: Math.ceil(photosState.length / thumbnailsPerPage) }).map((_: any, pageIndex: number) => (
                          <button
                            key={pageIndex}
                            onClick={() => setCurrentThumbnailPage(pageIndex)}
                            className={`w-2 h-2 rounded-full transition-all duration-200 ${
                              currentThumbnailPage === pageIndex 
                                ? 'bg-orange-500 scale-110' 
                                : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Fotoğraf eklenmedi</p>
              </div>
            )}

            {/* Mobile/Tablet Alt Header - Ad Soyad */}
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-1">
              <h2 className="text-base font-normal text-gray-900 truncate text-center">
                {user?.role === 'individual' 
                  ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Kullanıcı'
                  : user?.companyName || 'Kullanıcı'
                }
              </h2>
            </div>


          </div>

          {/* Orta Sütun - İlan Detayları (%25) */}
          <div className="lg:col-span-2">
            <div className="bg-white lg:pt-0 -mt-3 lg:mt-0">

              {/* Tab Headers - Mobil/Tablet */}
              <div className="lg:hidden flex border-b border-gray-200 -mx-4 sm:-mx-6 lg:mx-0">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'details'
                      ? 'text-orange-500 border-b-2 border-orange-500 bg-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  İlan Bilgileri
                </button>
                <button
                  onClick={() => setActiveTab('description')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'description'
                      ? 'text-orange-500 border-b-2 border-orange-500 bg-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Açıklama
                </button>
              </div>

              {/* Tab Contents */}
              <div className="lg:hidden">
                {/* İlan Bilgileri Tab */}
                {activeTab === 'details' && (
                  <div className="pt-2 pb-6">
                    <table className="w-full text-sm">
                      <tbody className="space-y-2">
                        {/* Fiyat */}
                        {customFields.price && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 lg:py-1.5 font-medium text-gray-700">Fiyat:</td>
                            <td className="py-2 lg:py-1.5 text-gray-900 text-right">
                              {typeof customFields.price === 'object' && customFields.price !== null
                                ? `${(customFields.price as any).value || ''} ${(customFields.price as any).unit || ''}`.trim()
                                : customFields.price
                              }
                            </td>
                          </tr>
                        )}

                        {/* Konum bilgisi */}
                        {((locationSettings?.showCity && (locationData.location?.city || locationData.city)) || 
                          (locationSettings?.showDistrict && (locationData.location?.district || locationData.district))) && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 lg:py-1.5 font-medium text-gray-700">Konum:</td>
                            <td className="py-2 lg:py-1.5 text-gray-900 text-right">
                              {locationSettings?.showCity && (locationData.location?.city || locationData.city) && 
                               (locationData.location?.city?.name || locationData.city?.name)}
                              {locationSettings?.showCity && (locationData.location?.city || locationData.city) && 
                               locationSettings?.showDistrict && (locationData.location?.district || locationData.district) && ' / '}
                              {locationSettings?.showDistrict && (locationData.location?.district || locationData.district) && 
                               (locationData.location?.district?.name || locationData.district?.name)}
                            </td>
                          </tr>
                        )}


                        {/* Kategori - Her kategori ayrı satırda */}
                        {categoryPath.map((cat, index) => (
                          <tr key={cat.id} className="border-b border-gray-100">
                            <td className="py-2 font-medium text-gray-700">
                              {cat.categoryType || `Seviye ${index + 1}`}:
                            </td>
                            <td className="py-2 text-gray-900 text-right">
                              {cat.name}
                            </td>
                          </tr>
                        ))}

                        {/* Custom Fields - show all field data properly */}
                        {customFieldsSchema.map((field) => {
                          const value = customFields[field.fieldName];
                          if (!value) return null;

                          let displayValue = '';
                          if (typeof value === 'object' && value !== null) {
                            if (value.value !== undefined) {
                              displayValue = `${value.value} ${value.unit || ''}`.trim();
                            } else {
                              // Skip complex objects that don't have value/unit structure
                              return null;
                            }
                          } else {
                            displayValue = String(value);
                          }

                          return (
                            <tr key={field.id} className="border-b border-gray-100">
                                                                                                                     <td className="py-2 lg:py-1.5 font-medium text-gray-700">
                              {field.label}:
                            </td>
                            <td className="py-2 lg:py-1.5 text-gray-900 text-right">
                                {displayValue}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Show any additional custom fields that aren't in schema */}
                        {Object.entries(customFields).map(([key, value]) => {
                          // Skip system fields, location, and fields already shown
                          if (key === 'title' || key === 'description' || key === 'price' || key === 'location') return null;
                          if (customFieldsSchema.some(f => f.fieldName === key)) return null;
                          if (!value) return null;

                          let displayValue = '';
                          if (typeof value === 'object' && value !== null) {
                            if (value.value !== undefined) {
                              displayValue = `${value.value} ${value.unit || ''}`.trim();
                            } else {
                              // Don't show complex JSON objects in details table
                              return null;
                            }
                          } else {
                            displayValue = String(value);
                          }

                          return (
                            <tr key={key} className="border-b border-gray-100">
                              <td className="py-2 lg:py-1.5 font-medium text-gray-700">
                                {key}:
                              </td>
                              <td className="py-2 lg:py-1.5 text-gray-900 text-right">
                                {displayValue}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Açıklama Tab */}
                {activeTab === 'description' && (
                  <div className="pt-2 pb-6">
                    {customFields.description ? (
                      <div 
                        className="text-gray-700 prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: customFields.description }}
                      />
                    ) : (
                      <p className="text-gray-500">Açıklama eklenmedi</p>
                    )}
                  </div>
                )}
              </div>

              {/* Desktop İlan Detayları - Eski hali korundu */}
              <div className="hidden lg:block">
                <table className="w-full text-sm">
                  <tbody className="space-y-2">
                    {/* Fiyat */}
                    {customFields.price && (
                      <tr className="border-b border-gray-200">
                                                    <td className="py-2 font-medium text-gray-700 lg:hidden">Fiyat:</td>
                            <td className="py-2 text-gray-900 lg:text-left lg:col-span-2 lg:text-orange-500 lg:text-base lg:font-semibold lg:pt-0">
                          {typeof customFields.price === 'object' && customFields.price !== null
                            ? `${(customFields.price as any).value || ''} ${(customFields.price as any).unit || ''}`.trim()
                            : customFields.price
                          }
                        </td>
                      </tr>
                    )}

                    {/* İl ve İlçe bilgisi - Tek satırda göster */}
                    {((locationSettings?.showCity && (locationData.location?.city || locationData.city)) || 
                      (locationSettings?.showDistrict && (locationData.location?.district || locationData.district))) && (
                      <tr className="border-b border-gray-200">
                                                    <td className="py-2 text-orange-500 font-semibold text-left">
                          {locationSettings?.showCity && (locationData.location?.city || locationData.city) && 
                           (locationData.location?.city?.name || locationData.city?.name)}
                          {locationSettings?.showCity && (locationData.location?.city || locationData.city) && 
                           locationSettings?.showDistrict && (locationData.location?.district || locationData.district) && ' / '}
                          {locationSettings?.showDistrict && (locationData.location?.district || locationData.district) && 
                           (locationData.location?.district?.name || locationData.district?.name)}
                        </td>
                      </tr>
                    )}

                    {/* Kategori - Her kategori ayrı satırda */}
                    {categoryPath.map((cat, index) => (
                      <tr key={cat.id} className="border-b border-dashed border-gray-200">
                        <td className="py-2 lg:py-1.5 font-medium text-gray-700">
                          {cat.categoryType || `Seviye ${index + 1}`}:
                        </td>
                        <td className="py-2 lg:py-1.5 text-gray-900">
                          {cat.name}
                        </td>
                      </tr>
                    ))}

                    {/* Custom Fields - show all field data properly */}
                    {customFieldsSchema.map((field) => {
                      const value = customFields[field.fieldName];
                      if (!value) return null;

                      let displayValue = '';
                      if (typeof value === 'object' && value !== null) {
                        if (value.value !== undefined) {
                          displayValue = `${value.value} ${value.unit || ''}`.trim();
                        } else {
                          // Skip complex objects that don't have value/unit structure
                          return null;
                        }
                      } else {
                        displayValue = String(value);
                      }

                      return (
                        <tr key={field.id} className="border-b border-dashed border-gray-200">
                                                                                                             <td className="py-2 lg:py-1.5 font-medium text-gray-700">
                              {field.label}:
                            </td>
                            <td className="py-2 lg:py-1.5 text-gray-900">
                            {displayValue}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Show any additional custom fields that aren't in schema */}
                    {Object.entries(customFields).map(([key, value]) => {
                      // Skip system fields, location, and fields already shown
                      if (key === 'title' || key === 'description' || key === 'price' || key === 'location') return null;
                      if (customFieldsSchema.some(f => f.fieldName === key)) return null;
                      if (!value) return null;

                      let displayValue = '';
                      if (typeof value === 'object' && value !== null) {
                        if (value.value !== undefined) {
                          displayValue = `${value.value} ${value.unit || ''}`.trim();
                        } else {
                          // Don't show complex JSON objects in details table
                          return null;
                        }
                      } else {
                        displayValue = String(value);
                      }

                      return (
                        <tr key={key} className="border-b border-dashed border-gray-200">
                          <td className="py-2 font-medium text-gray-700">
                            {key}:
                          </td>
                          <td className="py-2 text-gray-900">
                            {displayValue}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sağ Sütun - İletişim (%25) */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="bg-white border border-gray-200 p-6">
              {user ? (
                <div className="space-y-3 text-sm">
                  {/* Ad Soyad veya Firma Adı - sadece ilgili bilgileri göster */}
                  {user.role === 'individual' ? (
                    <div>
                      <p className="font-semibold text-gray-900">{user.firstName || ''} {user.lastName || ''}</p>
                      {/* Kayıt olma tarihi */}
                      {user.createdAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Hesap açma tarihi: {formatDate(user.createdAt)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {/* Kurumsal kullanıcı profil resmi */}
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {user.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt="Profil Resmi" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.companyName || 'Belirtilmemiş'}</p>
                      </div>
                    </div>
                  )}

                  {/* İletişim Bilgileri - Butonlar içerisinde */}
                  {user.mobilePhone && (
                    <button className="w-full px-3 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Cep:</span>
                        <span className="text-gray-900">{user.mobilePhone}</span>
                      </div>
                    </button>
                  )}
                  {user.whatsappNumber && (
                    <button className="w-full px-3 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">WhatsApp:</span>
                        <span className="text-gray-900">{user.whatsappNumber}</span>
                      </div>
                    </button>
                  )}
                  {user.role === 'corporate' && user.businessPhone && (
                    <button className="w-full px-3 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">İş:</span>
                        <span className="text-gray-900">{user.businessPhone}</span>
                      </div>
                    </button>
                  )}

                  {/* Ülke ve Mahalle - Butonlar içerisinde */}
                  {locationSettings?.showCountry && (locationData.location?.country || locationData.country) && (
                    <button className="w-full text-left px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                      <span className="font-medium text-gray-700">Ülke:</span> {locationData.location?.country?.name || locationData.country?.name}
                    </button>
                  )}
                  {locationSettings?.showNeighborhood && (locationData.location?.neighborhood || locationData.neighborhood) && (
                    <button className="w-full text-left px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                      <span className="font-medium text-gray-700">Mahalle:</span> {locationData.location?.neighborhood?.name || locationData.neighborhood?.name}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Kullanıcı bilgileri yükleniyor...</p>
              )}
            </div>
          </div>
        </div>

        {/* Açıklama */}
        <div className="hidden lg:block mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Açıklama</h3>
            {customFields.description ? (
              <div 
                className="text-gray-700 prose max-w-none"
                dangerouslySetInnerHTML={{ __html: customFields.description }}
              />
            ) : (
              <p className="text-gray-500">Açıklama eklenmedi</p>
            )}
          </div>
        </div>

        {/* Eylem Butonları */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(`/create-listing/step-3?classifiedId=${currentClassifiedId}`)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Önceki Adım
          </button>

          <button
            onClick={() => {
              // TODO: İlanı yayınla fonksiyonu
              toast({
                title: "Bilgi",
                description: 'İlan yayınlama özelliği yakında eklenecek'
              });
            }}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            İlanı Yayınla
          </button>
        </div>

        {/* Performance indicator */}
        <PageLoadIndicator />
      </div>
    </CreateListingLayout>
  );
}