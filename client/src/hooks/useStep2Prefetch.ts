import { useQueryClient } from '@tanstack/react-query';

export function useStep2Prefetch() {
  const queryClient = useQueryClient();

  const prefetchStep2Data = async (categoryId: number) => {
    try {
      // 1. Custom Fields prefetch - Step2'de kullanılacak
      queryClient.prefetchQuery({
        queryKey: ["/api/categories", categoryId, "custom-fields"],
        queryFn: async () => {
          const response = await fetch(`/api/categories/${categoryId}/custom-fields`, {
            credentials: "include",
          });
          if (!response.ok) throw new Error('Failed to prefetch custom fields');
          return response.json();
        },
        staleTime: 10 * 60 * 1000, // 10 dakika cache
      });

      // 2. Locations Tree - Step2 location dropdown'ları için
      queryClient.prefetchQuery({
        queryKey: ["/api/locations"],
        queryFn: async () => {
          const response = await fetch('/api/locations', {
            credentials: "include",
          });
          if (!response.ok) throw new Error('Failed to prefetch locations');
          return response.json();
        },
        staleTime: 10 * 60 * 1000, // 10 dakika cache
      });

      // 3. Location Settings - Step2 form görünürlüğü için
      queryClient.prefetchQuery({
        queryKey: ["/api/location-settings/public"],
        queryFn: async () => {
          const response = await fetch('/api/location-settings/public', {
            credentials: "include",
          });
          if (!response.ok) throw new Error('Failed to prefetch location settings');
          return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 dakika cache
      });

      console.log(`✅ Step2 verileri prefetch edildi (categoryId: ${categoryId})`);
    } catch (error) {
      // Silent fail - prefetch hatası kullanıcı deneyimini bozmasın
      console.log(`⚠️ Step2 prefetch hatası: ${error}`);
    }
  };

  return { prefetchStep2Data };
}