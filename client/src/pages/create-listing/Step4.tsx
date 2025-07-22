import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useListing } from '../../contexts/ListingContext';
import { useDraftListing } from '@/hooks/useDraftListing';
import { useCategoriesTree } from '@/hooks/useCategories';
import { useLocationsTree } from '@/hooks/useLocations';
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

  // Draft listing data
  const { data: draftData } = useDraftListing(currentClassifiedId);
  const { data: categories } = useCategoriesTree();
  const { data: locations } = useLocationsTree();

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
  const photos = draftData.photos ? JSON.parse(draftData.photos) : [];
  const locationData = draftData.locationData ? JSON.parse(draftData.locationData) : {};

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Başlık */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {customFields.title || 'İlan Başlığı Girilmedi'}
          </h1>
        </div>

        {/* Ana İçerik - 3 Sütun */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Sol Sütun - Fotoğraf Galerisi */}
          <div className="lg:col-span-1">
            {photos.length > 0 ? (
              <div className="space-y-4">
                {/* Ana Swiper */}
                <Swiper
                  modules={[Navigation, Pagination, Thumbs]}
                  navigation
                  pagination={{ clickable: true }}
                  thumbs={{ swiper: thumbsSwiper }}
                  className="w-full h-80 rounded-lg overflow-hidden"
                >
                  {photos.map((photo: any, index: number) => (
                    <SwiperSlide key={index}>
                      <img
                        src={photo.url}
                        alt={`Fotoğraf ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>

                {/* Thumbnail Swiper */}
                {photos.length > 1 && (
                  <Swiper
                    modules={[Thumbs]}
                    spaceBetween={8}
                    slidesPerView={4}
                    watchSlidesProgress
                    onSwiper={setThumbsSwiper}
                    className="w-full h-20"
                  >
                    {photos.map((photo: any, index: number) => (
                      <SwiperSlide key={index} className="cursor-pointer">
                        <img
                          src={photo.thumbnail || photo.url}
                          alt={`Küçük ${index + 1}`}
                          className="w-full h-full object-cover rounded border-2 border-transparent hover:border-orange-500"
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                )}
              </div>
            ) : (
              <div className="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Fotoğraf eklenmedi</p>
              </div>
            )}
          </div>

          {/* Orta Sütun - İlan Detayları */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">İlan Detayları</h3>
              
              <table className="w-full text-sm">
                <tbody className="space-y-2">
                  {/* Fiyat */}
                  {customFields.price && (
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-medium text-gray-700">Fiyat:</td>
                      <td className="py-2 text-gray-900">
                        {typeof customFields.price === 'object' && customFields.price !== null
                          ? `${(customFields.price as any).value || ''} ${(customFields.price as any).unit || ''}`.trim()
                          : customFields.price
                        }
                      </td>
                    </tr>
                  )}

                  {/* Kategori */}
                  <tr className="border-b border-gray-100">
                    <td className="py-2 font-medium text-gray-700">Kategori:</td>
                    <td className="py-2 text-gray-900">
                      {categoryPath.map(cat => cat.name).join(' > ')}
                    </td>
                  </tr>

                  {/* Custom Fields */}
                  {Object.entries(customFields).map(([key, value]) => {
                    if (key === 'title' || key === 'description' || key === 'price') return null;
                    
                    return (
                      <tr key={key} className="border-b border-gray-100">
                        <td className="py-2 font-medium text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </td>
                        <td className="py-2 text-gray-900">
                          {typeof value === 'object' && value !== null
                            ? `${(value as any).value || ''} ${(value as any).unit || ''}`.trim()
                            : String(value || '')
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sağ Sütun - Lokasyon */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lokasyon</h3>
              
              {locationData.location ? (
                <div className="space-y-2 text-sm">
                  {locationData.location.country && (
                    <p><span className="font-medium">Ülke:</span> {locationData.location.country.name}</p>
                  )}
                  {locationData.location.city && (
                    <p><span className="font-medium">İl:</span> {locationData.location.city.name}</p>
                  )}
                  {locationData.location.district && (
                    <p><span className="font-medium">İlçe:</span> {locationData.location.district.name}</p>
                  )}
                  {locationData.location.neighborhood && (
                    <p><span className="font-medium">Mahalle:</span> {locationData.location.neighborhood.name}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Lokasyon seçilmedi</p>
              )}
            </div>
          </div>
        </div>

        {/* Açıklama */}
        <div className="mb-6">
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