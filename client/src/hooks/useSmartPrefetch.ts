import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

// Feature flag - kolayca açıp kapanabilir
const ENABLE_HOVER_PREFETCH = true;

export function useSmartPrefetch() {
  const queryClient = useQueryClient();
  const prefetchedRef = useRef<Set<string>>(new Set());

  // Hover prefetch - sadece alt kategoriler için
  const prefetchChildCategories = useCallback((categoryId: number, categoryName: string) => {
    if (!ENABLE_HOVER_PREFETCH) return;
    
    const cacheKey = `children-${categoryId}`;
    
    // Daha önce prefetch edilmişse skip et
    if (prefetchedRef.current.has(cacheKey)) return;
    
    // Cache'de zaten varsa skip et
    const existingData = queryClient.getQueryData(["/api/categories", categoryId, "children"]);
    if (existingData) return;
    
    // Background prefetch - hiçbir state etkilemez
    try {
      queryClient.prefetchQuery({
        queryKey: ["/api/categories", categoryId, "children"],
        queryFn: async () => {
          const response = await fetch(`/api/categories/${categoryId}/children`, {
            credentials: "include",
          });
          if (!response.ok) throw new Error('Failed to prefetch');
          return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 dakika cache
        gcTime: 10 * 60 * 1000, // 10 dakika memory'de tut
      }).catch((error) => {
        // Sessizce handle et - hiçbir UI etkilenmesin
        console.debug(`Prefetch failed for ${categoryName}:`, error.message);
      });
      
      prefetchedRef.current.add(cacheKey);
    } catch (error) {
      // Hiçbir error UI'ına yansımasın
      console.debug(`Hover prefetch error for ${categoryName}`);
    }
  }, [queryClient]);

  // Hover event handlers
  const handleCategoryHover = useCallback((category: { id: number; name: string; children?: any[] }) => {
    // Sadece alt kategorisi olan kategoriler için prefetch yap
    if (category.children && category.children.length > 0) {
      prefetchChildCategories(category.id, category.name);
    }
  }, [prefetchChildCategories]);

  return {
    handleCategoryHover,
    // Debug info (production'da kaldırılabilir)
    getPrefetchedCount: () => prefetchedRef.current.size,
  };
}