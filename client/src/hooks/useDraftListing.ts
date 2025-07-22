import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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

// Hook for fetching a single draft listing
export function useDraftListing(id?: number) {
  return useQuery({
    queryKey: ['/api/draft-listings', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/draft-listings/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('İlan taslağı alınamadı');
      }
      return response.json() as Promise<DraftListing>;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook for fetching user's draft listings
export function useUserDraftListings() {
  return useQuery({
    queryKey: ['/api/draft-listings'],
    queryFn: async () => {
      const response = await fetch('/api/draft-listings');
      if (!response.ok) {
        throw new Error('İlan taslakları alınamadı');
      }
      return response.json() as Promise<DraftListing[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for creating a new draft listing
export function useCreateDraftListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return apiRequest('/api/draft-listings', {
        method: 'POST',
        body: JSON.stringify({}),
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

// Hook for deleting a draft listing
export function useDeleteDraftListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/draft-listings/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/draft-listings'] });
    },
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