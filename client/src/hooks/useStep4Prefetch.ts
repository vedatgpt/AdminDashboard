import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function useStep4Prefetch() {
  const queryClient = useQueryClient();

  const prefetchStep4Data = useCallback(async (classifiedId: number, userId: number) => {
    console.log('🔄 Step4 prefetch başlatılıyor...');
    
    try {
      // 1. Draft listing'i prefetch et (güncel fotoğraflar ve form verileriyle)
      await queryClient.prefetchQuery({
        queryKey: ['/api/draft-listings', classifiedId],
        queryFn: () => 
          fetch(`/api/draft-listings/${classifiedId}`)
            .then(res => res.json()),
        staleTime: 2 * 60 * 1000, // 2 dakika cache
      });

      // 2. User auth data'yı prefetch et (publish izinleri için)
      await queryClient.prefetchQuery({
        queryKey: ['/api/auth/me'],
        queryFn: () =>
          fetch('/api/auth/me')
            .then(res => res.json()),
        staleTime: 5 * 60 * 1000, // 5 dakika cache
      });

      // 3. Categories data'yı prefetch et (breadcrumb için)
      await queryClient.prefetchQuery({
        queryKey: ['/api/categories'],
        queryFn: () =>
          fetch('/api/categories')
            .then(res => res.json()),
        staleTime: 10 * 60 * 1000, // 10 dakika cache
      });

      // 4. Locations data'yı prefetch et (adres gösterimi için)
      await queryClient.prefetchQuery({
        queryKey: ['/api/locations'],
        queryFn: () =>
          fetch('/api/locations')
            .then(res => res.json()),
        staleTime: 10 * 60 * 1000, // 10 dakika cache
      });

      console.log('✅ Step4 verileri prefetch edildi');
    } catch (error) {
      console.error('❌ Step4 prefetch hatası:', error);
    }
  }, [queryClient]);

  const smartPrefetchStep4 = useCallback((classifiedId: number, userId: number, reason: string) => {
    console.log(`🎯 Step4 prefetch tetiklendi: ${reason}`);
    
    // Cache'i temizle - güncel verileri al
    queryClient.removeQueries({ queryKey: ['/api/draft-listings', classifiedId] });
    
    // Prefetch işlemini başlat
    prefetchStep4Data(classifiedId, userId);
  }, [queryClient, prefetchStep4Data]);

  return {
    prefetchStep4Data,
    smartPrefetchStep4
  };
}