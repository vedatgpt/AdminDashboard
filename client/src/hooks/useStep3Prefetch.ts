import { useQueryClient } from '@tanstack/react-query';

export function useStep3Prefetch() {
  const queryClient = useQueryClient();

  const prefetchStep3Data = async (classifiedId: number, userId: number) => {
    try {
      // 1. Draft listing data - Step3'te mevcut draft'ı görmek için
      queryClient.prefetchQuery({
        queryKey: ["/api/draft-listings", classifiedId],
        queryFn: async () => {
          const response = await fetch(`/api/draft-listings/${classifiedId}`, {
            credentials: "include",
          });
          if (!response.ok) throw new Error('Failed to prefetch draft listing');
          return response.json();
        },
        staleTime: 2 * 60 * 1000, // 2 dakika cache - draft data sık değişebilir
      });

      // 2. User auth data - Step3'te upload permissions için
      queryClient.prefetchQuery({
        queryKey: ["/api/auth/me"],
        queryFn: async () => {
          const response = await fetch('/api/auth/me', {
            credentials: "include",
          });
          if (!response.ok) throw new Error('Failed to prefetch user auth');
          return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 dakika cache
      });

      console.log(`✅ Step3 verileri prefetch edildi (classifiedId: ${classifiedId})`);
    } catch (error) {
      // Silent fail - prefetch hatası kullanıcı deneyimini bozmasın
      console.log(`⚠️ Step3 prefetch hatası: ${error}`);
    }
  };

  return { prefetchStep3Data };
}