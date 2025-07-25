import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useLandingPrefetch() {
  const queryClient = useQueryClient();

  const prefetchStep1Data = useCallback(async () => {
    try {

      
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

        
        // Icon prefetch - AGGRESSIVE BROWSER CACHE
        const iconPromises = categories
          .filter(cat => cat.icon) // Sadece ikonu olan kategoriler
          .map(cat => {
            const iconUrl = `${window.location.origin}/uploads/category-icons/${cat.icon}`;
            return new Promise<void>((resolve) => {
              // 1. Fetch API ile cache-first
              fetch(iconUrl, { 
                cache: 'force-cache',
                mode: 'same-origin'
              }).then(response => {
                if (response.ok) {

                  
                  // 2. Image preload ile de cache'e ekle
                  const img = new Image();
                  img.onload = () => {

                    resolve();
                  };
                  img.onerror = () => {

                    resolve();
                  };
                  img.src = iconUrl;
                } else {

                  resolve();
                }
              }).catch(() => {

                resolve();
              });
            });
          });

        // Navbar logosu da AGGRESSIVE cache
        const logoPath = '/attached_assets/logo_1752808818099.png';
        const logoPromise = new Promise<void>((resolve) => {
          // 1. Fetch API ile cache-first
          fetch(logoPath, { 
            cache: 'force-cache',
            mode: 'same-origin'
          }).then(response => {
            if (response.ok) {

              
              // 2. Image preload ile de cache'e ekle
              const img = new Image();
              img.onload = () => {

                resolve();
              };
              img.onerror = () => {

                resolve();
              };
              img.src = logoPath;
            } else {
  
              resolve();
            }
          }).catch(() => {

            resolve();
          });
        });

        // Tüm ikonları + logoyu paralel yükle
        await Promise.allSettled([...iconPromises, logoPromise]);

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


      }


    } catch (error) {

    }
  }, [queryClient]);

  return { prefetchStep1Data };
}