import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useStep5Prefetch = () => {
  const queryClient = useQueryClient();

  const prefetchStep5Data = useCallback(async (categoryId: number, classifiedId?: string) => {
    console.log('🚀 Step5 Prefetch başlatıldı:', { categoryId, classifiedId });
    
    try {
      const prefetchPromises = [];

      // 1. Category packages - Step5'te kullanılan paket bilgileri
      if (categoryId) {
        prefetchPromises.push(
          queryClient.prefetchQuery({
            queryKey: ['/api/categories', categoryId, 'packages'],
            queryFn: async () => {
              const response = await fetch(`/api/categories/${categoryId}/packages`);
              if (!response.ok) throw new Error('Failed to fetch category packages');
              return response.json();
            },
            staleTime: 10 * 60 * 1000, // 10 minutes
            gcTime: 15 * 60 * 1000, // 15 minutes
          })
        );
      }

      // 2. Doping packages - Step5'te kullanılan doping paketleri
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: ['/api/doping-packages'],
          queryFn: async () => {
            const response = await fetch('/api/doping-packages');
            if (!response.ok) throw new Error('Failed to fetch doping packages');
            return response.json();
          },
          staleTime: 10 * 60 * 1000, // 10 minutes
          gcTime: 15 * 60 * 1000, // 15 minutes
        })
      );

      // 3. Draft listing data - güncel draft verisi
      if (classifiedId) {
        prefetchPromises.push(
          queryClient.prefetchQuery({
            queryKey: ['/api/draft-listings', classifiedId],
            queryFn: async () => {
              const response = await fetch(`/api/draft-listings/${classifiedId}`);
              if (!response.ok) throw new Error('Failed to fetch draft listing');
              return response.json();
            },
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 2 * 60 * 1000, // 2 minutes
          })
        );
      }

      // 4. User authentication state
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: ['/api/auth/me'],
          queryFn: async () => {
            const response = await fetch('/api/auth/me');
            if (!response.ok) throw new Error('Failed to fetch user');
            return response.json();
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
        })
      );

      // Tüm prefetch işlemlerini paralel olarak çalıştır
      await Promise.all(prefetchPromises);
      
      console.log('✅ Step5 Prefetch tamamlandı:', { 
        categoryId, 
        classifiedId,
        prefetchCount: prefetchPromises.length 
      });
    } catch (error) {
      console.error('❌ Step5 Prefetch hatası:', error);
    }
  }, [queryClient]);

  const smartPrefetchStep5 = useCallback(async (
    categoryId: number, 
    classifiedId: string, 
    triggerSource: string
  ) => {
    console.log(`🎯 Smart Step5 Prefetch triggered from: ${triggerSource}`);
    await prefetchStep5Data(categoryId, classifiedId);
  }, [prefetchStep5Data]);

  return {
    prefetchStep5Data,
    smartPrefetchStep5
  };
};