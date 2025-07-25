import { DraftListing } from '@/hooks/useDraftListing';
import BreadcrumbNav from '@/components/listing/BreadcrumbNav';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Category } from '@shared/schema';

interface DraftContinueModalProps {
  draft: DraftListing;
  isOpen: boolean;
  onContinue: () => void;
  onNewListing: () => void;
}

export default function DraftContinueModal({ 
  draft, 
  isOpen, 
  onContinue, 
  onNewListing 
}: DraftContinueModalProps) {
  // CACHE FIX: Prefetch edilmiş data'yı kullan - API çağrısı yapmaz
  const { data: allCategories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    enabled: false, // Sadece cache'den oku, yeni istek yapma
    staleTime: Infinity, // Cache'deki data fresh kabul et
  });
  
  // Build flat categories array for path building
  const flatCategories = useMemo(() => {
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

  // Build category path from draft categoryId
  const categoryPath = useMemo(() => {
    if (!draft.categoryId || flatCategories.length === 0) return [];
    
    const buildCategoryPath = (categoryId: number): Category[] => {
      const path: Category[] = [];
      let currentId = categoryId;
      
      while (currentId) {
        const category = flatCategories.find(c => c.id === currentId);
        if (category) {
          path.unshift(category);
          currentId = category.parentId || 0;
        } else {
          break;
        }
      }
      return path;
    };
    
    return buildCategoryPath(draft.categoryId);
  }, [draft.categoryId, flatCategories]);

  // Format creation date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              İlan vermeye başlayıp tamamlamadığınız bir ilan var
            </h2>
            <p className="text-gray-600">
              Kaldığınız yerden devam etmek ister misiniz?
            </p>
          </div>

          {/* Draft Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            {/* Category Breadcrumb */}
            {categoryPath.length > 0 && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Kategori:
                </label>
                <BreadcrumbNav 
                  categoryPath={categoryPath}
                  onCategoryClick={() => {}} // Disabled in modal
                  disableFirstCategory={true}
                />
              </div>
            )}

            {/* Title */}
            {draft.title && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  İlan Başlığı:
                </label>
                <p className="text-gray-900">{draft.title}</p>
              </div>
            )}

            {/* Creation Date */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Oluşturma Tarihi:
              </label>
              <p className="text-gray-600">{formatDate(draft.createdAt)}</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={onContinue}
              className="w-full py-3 px-4 bg-[#EC7830] text-white rounded-lg hover:bg-[#d86929] transition-colors font-medium"
            >
              Evet, Bu İlanın Bilgilerini Girmeye Devam Etmek İstiyorum
            </button>
            
            <button
              onClick={onNewListing}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Hayır, Yeni Bir İlan Vermek İstiyorum
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}