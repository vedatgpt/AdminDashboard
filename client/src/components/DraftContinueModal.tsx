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
           
            <p className="text-md font-medium text-gray-900">
              Tamamlanmamış bir ilanınız var. Devam etmek ister misiniz?
            </p>
          </div>




         

          

          {/* Draft Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">

            {/* Title */}
            {draft.title && (
              <div className="mb-2">
                <p className="text-sm text-gray-900">{draft.title}</p>
              </div>
            )}
      
            {/* Category Breadcrumb */}
            {categoryPath.length > 0 && (
              <div className="mb-2">
                
                <BreadcrumbNav 
                  categoryPath={categoryPath}
                  onCategoryClick={() => {}} // Disabled in modal
                  disableFirstCategory={true}
                />
              </div>
            )}

          

            {/* Creation Date */}
            <div>
              <p className="text-xs text-gray-600">Tarih: {formatDate(draft.createdAt)}</p>
            </div>
          </div>

          
          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={onContinue}
              type="button"
              className="w-full py-3 px-4 inline-flex items-center justify-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d86929] focus:outline-none focus:bg-[#d86929] disabled:opacity-50 disabled:pointer-events-none"
            >
              Devam Et
            </button>
            
            <button
              onClick={onNewListing}
              type="button"
              className="w-full py-3 px-4 inline-flex items-center justify-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
            >
              Yeni İlan Ver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}