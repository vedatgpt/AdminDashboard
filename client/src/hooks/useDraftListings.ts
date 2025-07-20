import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DraftListing, InsertDraftListing, UpdateDraftListing } from '@shared/schema';

const apiRequest = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Request failed');
  }

  return response.json();
};

// Generate UUID for draft listings
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const useDraftListing = (draftId?: string) => {
  return useQuery<DraftListing>({
    queryKey: ['/api/draft-listings', draftId],
    enabled: !!draftId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useDraftListingsByUser = () => {
  return useQuery<DraftListing[]>({
    queryKey: ['/api/draft-listings'],
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useCreateDraftListing = () => {
  const queryClient = useQueryClient();
  
  return useMutation<DraftListing, Error, Omit<InsertDraftListing, 'id'>>({
    mutationFn: async (data) => {
      const draftData = {
        ...data,
        id: generateUUID(),
      };
      return apiRequest('/api/draft-listings', {
        method: 'POST',
        body: JSON.stringify(draftData),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/draft-listings'] });
      queryClient.setQueryData(['/api/draft-listings', data.id], data);
    },
  });
};

export const useUpdateDraftListing = () => {
  const queryClient = useQueryClient();
  
  return useMutation<DraftListing, Error, { id: string; updates: UpdateDraftListing }>({
    mutationFn: async ({ id, updates }) => {
      return apiRequest(`/api/draft-listings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/draft-listings'] });
      queryClient.setQueryData(['/api/draft-listings', data.id], data);
    },
  });
};

export const useDeleteDraftListing = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      return apiRequest(`/api/draft-listings/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/draft-listings'] });
      queryClient.removeQueries({ queryKey: ['/api/draft-listings', id] });
    },
  });
};