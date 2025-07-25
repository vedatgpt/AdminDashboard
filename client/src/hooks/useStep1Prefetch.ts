import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function useStep1Prefetch() {
  const queryClient = useQueryClient();

  const prefetchStep1Data = useCallback(async (userId: number) => {
    console.log('🔄 Step1 draft modal prefetch başlatılıyor...');
    
    try {
      // 1. Mevcut draft'ları prefetch et
      await queryClient.prefetchQuery({
        queryKey: ['/api/draft-listings'],
        staleTime: 1 * 60 * 1000, // 1 dakika
      });

      // 2. Kategorileri prefetch et (modal için gerekli)
      await queryClient.prefetchQuery({
        queryKey: ['/api/categories'],
        staleTime: 10 * 60 * 1000, // 10 dakika
      });

      // 3. CategoriesTree'yi prefetch et (DraftContinueModal için gerekli)
      await queryClient.prefetchQuery({
        queryKey: ['/api/categories', 'tree'],
        queryFn: () => fetch('/api/categories').then(res => {
          if (!res.ok) throw new Error('Failed to fetch categories');
          return res.json();
        }),
        staleTime: 10 * 60 * 1000, // 10 dakika
      });

      // 4. User auth verilerini prefetch et
      await queryClient.prefetchQuery({
        queryKey: ['/api/auth/me'],
        staleTime: 5 * 60 * 1000, // 5 dakika
      });

      console.log('✅ Step1 draft modal verileri prefetch edildi:');
      console.log('  - Draft listings cache: 1 dakika');
      console.log('  - Categories cache: 10 dakika'); 
      console.log('  - Categories tree cache: 10 dakika');
      console.log('  - Auth data cache: 5 dakika');
    } catch (error) {
      console.error('❌ Step1 prefetch hatası:', error);
    }
  }, [queryClient]);

  const smartPrefetchStep1 = useCallback((userId: number, reason: string) => {
    console.log(`🎯 Step1 prefetch tetiklendi: ${reason}`);
    
    // Prefetch işlemini başlat
    prefetchStep1Data(userId);
  }, [prefetchStep1Data]);

  return {
    smartPrefetchStep1,
    prefetchStep1Data
  };
}