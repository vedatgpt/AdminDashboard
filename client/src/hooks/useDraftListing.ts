import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './useAuth';

// Draft listing types
export interface DraftListing {
  id: number;
  userId: number;
  categoryId: number | null;
  title: string | null;
  description: string | null;
  price: string | null;
  customFields: string | null;
  photos: string | null;
  locationData: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Hook for fetching a single draft listing (authentication required)
export function useDraftListing(id?: number) {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['/api/draft-listings', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/draft-listings/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        if (response.status === 401) {
          throw new Error('Giriş yapmamış kullanıcılar ilan taslağına erişemez');
        }
        if (response.status === 403) {
          throw new Error('Bu ilan taslağına erişim yetkiniz yok');
        }
        throw new Error('İlan taslağı alınamadı');
      }
      return response.json() as Promise<DraftListing>;
    },
    enabled: !!id && isAuthenticated, // Only run when authenticated
    staleTime: 60 * 1000, // 1 minute for better performance
  });
}

// Hook for fetching user's draft listings (authentication required) - DEPLOY FIX VERSION
export function useUserDraftListings() {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['/api/draft-listings'],
    queryFn: async () => {
  
      
      const response = await fetch('/api/draft-listings', {
        credentials: 'include', // Deploy fix: ensure session cookies
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {

          throw new Error('Giriş yapmamış kullanıcılar ilan taslağına erişemez');
        }

        throw new Error('İlan taslakları alınamadı');
      }
      
      const drafts = await response.json() as DraftListing[];
      return drafts;
    },
    enabled: isAuthenticated, // Only run when authenticated
    staleTime: 30 * 1000, // DEPLOY FIX: Reduced to 30 seconds for modal system
    refetchOnWindowFocus: true, // DEPLOY FIX: Refresh when window gains focus
  });
}

// Hook for creating a new draft listing
export function useCreateDraftListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      categoryId: number;
      title?: string | null;
      description?: string | null;
      price?: string | null;
      customFields?: string | null;
      photos?: string | null;
      locationData?: string | null;
      status?: 'draft' | 'published';
    }) => {
      return apiRequest('/api/draft-listings', {
        method: 'POST',
        body: JSON.stringify(data),
      }) as Promise<DraftListing>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/draft-listings'] });
    },
  });
}

// Hook for updating a draft listing
export function useUpdateDraftListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DraftListing> }) => {
      return apiRequest(`/api/draft-listings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }) as Promise<DraftListing>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/draft-listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/draft-listings', data.id] });
    },
  });
}

// Hook for deleting a draft listing - DEPLOY FIX VERSION
export function useDeleteDraftListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      // DEPLOY FIX: Enhanced error handling and debug logging
      console.log(`🗑️ DEPLOY FIX: Draft ${id} siliniyor...`);
      
      const response = await fetch(`/api/draft-listings/${id}`, {
        method: 'DELETE',
        credentials: 'include', // Deploy fix: ensure session cookies
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }));
        console.error('❌ DEPLOY ERROR - Draft silme başarısız:', response.status, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Draft silinemedi`);
      }
      
      const result = await response.json();
      console.log('✅ DEPLOY SUCCESS - Draft silindi:', result);
      return result;
    },
    onSuccess: (data, id) => {
      console.log(`🔄 DEPLOY FIX: Cache invalidation başlatılıyor - Draft ${id} silindi`);
      
      // Force cache invalidation with multiple strategies
      queryClient.invalidateQueries({ queryKey: ['/api/draft-listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/draft-listings', id] });
      queryClient.refetchQueries({ queryKey: ['/api/draft-listings'] });
      
      console.log('✅ DEPLOY SUCCESS - Cache temizlendi');
    },
    onError: (error, id) => {
      console.error(`❌ DEPLOY ERROR - Draft ${id} silme mutation hatası:`, error);
    }
  });
}

// Hook for checking user's draft for specific category
export function useUserDraftForCategory(categoryId?: number) {
  return useQuery({
    queryKey: ['/api/draft-listings', 'category', categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      const response = await fetch(`/api/draft-listings?categoryId=${categoryId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Draft araması yapılamadı');
      }
      const drafts = await response.json() as DraftListing[];
      return drafts.length > 0 ? drafts[0] : null;
    },
    enabled: !!categoryId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Hook for publishing a draft listing
export function usePublishDraftListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/draft-listings/${id}/publish`, {
        method: 'POST',
        body: JSON.stringify({}),
      }) as Promise<DraftListing>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/draft-listings'] });
    },
  });
}