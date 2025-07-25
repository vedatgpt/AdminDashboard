import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useLandingPrefetch() {
  const queryClient = useQueryClient();

  const prefetchStep1Data = useCallback(async () => {
    try {
      console.log('🚀 Landing prefetch başlatılıyor: Step-1 verileri + kategori ikonları');
      
      // 1. Kategori verilerini prefetch et
      await queryClient.prefetchQuery({
        queryKey: ['/api/categories'],
        queryFn: async () => {
          const response = await fetch('/api/categories', {
            credentials: 'include'
          });
          if (!response.ok) throw new Error('Categories prefetch failed');
          return response.json();
        },
        staleTime: 10 * 60 * 1000, // 10 dakika
        gcTime: 15 * 60 * 1000 // 15 dakika memory'de tut
      });

      // 2. Kategorileri al ve ikonları prefetch et
      const categories = queryClient.getQueryData(['/api/categories']) as any[];
      if (categories && categories.length > 0) {
        console.log(`📦 ${categories.length} kategori bulundu, ikonlar prefetch ediliyor...`);
        
        // Icon prefetch - paralel olarak yükle
        const iconPromises = categories
          .filter(cat => cat.icon) // Sadece ikonu olan kategoriler
          .map(cat => {
            const iconUrl = `${window.location.origin}/uploads/category-icons/${cat.icon}`;
            return new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => {
                console.log(`✅ İkon yüklendi: ${cat.name}`);
                resolve();
              };
              img.onerror = () => {
                console.log(`❌ İkon yüklenemedi: ${cat.name}`);
                resolve(); // Error'da bile resolve et
              };
              img.src = iconUrl;
            });
          });

        // Tüm ikonları paralel yükle
        await Promise.allSettled(iconPromises);
        console.log('🎯 Tüm kategori ikonları prefetch tamamlandı');
      }

      // 3. Auth verilerini de prefetch et
      const authData = await queryClient.fetchQuery({
        queryKey: ['/api/auth/me'],
        queryFn: async () => {
          const response = await fetch('/api/auth/me', {
            credentials: 'include'
          });
          if (!response.ok) throw new Error('Auth prefetch failed');
          return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 dakika
        gcTime: 10 * 60 * 1000
      });

      // 4. Eğer kullanıcı giriş yapmışsa draft modal için verileri prefetch et
      if (authData && authData.id) {
        console.log('👤 Kullanıcı giriş yapmış, draft modal verileri prefetch ediliyor...');
        
        // Draft listings prefetch
        await queryClient.prefetchQuery({
          queryKey: ['/api/draft-listings'],
          queryFn: async () => {
            const response = await fetch('/api/draft-listings', {
              credentials: 'include'
            });
            if (!response.ok) throw new Error('Draft listings prefetch failed');
            return response.json();
          },
          staleTime: 1 * 60 * 1000, // 1 dakika
          gcTime: 2 * 60 * 1000
        });

        // Categories tree prefetch (modal breadcrumb için)
        await queryClient.prefetchQuery({
          queryKey: ['/api/categories', 'tree'],
          queryFn: async () => {
            const response = await fetch('/api/categories', {
              credentials: 'include'
            });
            if (!response.ok) throw new Error('Categories tree prefetch failed');
            return response.json();
          },
          staleTime: 10 * 60 * 1000, // 10 dakika
          gcTime: 15 * 60 * 1000
        });

        console.log('✅ Draft modal verileri prefetch tamamlandı');
      }

      console.log('✅ Landing prefetch tamamlandı: Step-1 + Draft Modal hazır!');
    } catch (error) {
      console.error('Landing prefetch hatası:', error);
    }
  }, [queryClient]);

  return { prefetchStep1Data };
}