import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import type { CategoryCustomField, InsertCustomField } from "@shared/schema";

// Optimized hook for custom fields with inheritance
export function useCustomFields(categoryId: number | null) {
  return useQuery({
    queryKey: ['/api/categories', categoryId, 'custom-fields'],
    enabled: !!categoryId,
    staleTime: 3 * 60 * 1000, // 3 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Hook for category-specific custom fields (no inheritance)
export function useCategoryCustomFields(categoryId: number | null) {
  return useQuery({
    queryKey: ['/api/custom-fields', categoryId],
    enabled: !!categoryId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Mutation hooks for custom fields
export function useCreateCustomField() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InsertCustomField) => apiRequest(`/api/custom-fields`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories', variables.categoryId, 'custom-fields'] });
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields', variables.categoryId] });
    },
  });
}

export function useUpdateCustomField() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertCustomField> }) => 
      apiRequest(`/api/custom-fields/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories', data.categoryId, 'custom-fields'] });
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields', data.categoryId] });
    },
  });
}

export function useDeleteCustomField() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiRequest(`/api/custom-fields/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: (_, variables) => {
      // Invalidate all custom fields caches since we don't know the category ID
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields'] });
    },
  });
}

// Cache invalidation helper for custom fields
export function useCustomFieldsCache() {
  const queryClient = useQueryClient();

  const invalidateCustomFields = (categoryId: number) => {
    queryClient.invalidateQueries({ queryKey: ['/api/categories', categoryId, 'custom-fields'] });
    queryClient.invalidateQueries({ queryKey: ['/api/custom-fields', categoryId] });
  };

  const invalidateAllCustomFields = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    queryClient.invalidateQueries({ queryKey: ['/api/custom-fields'] });
  };

  return {
    invalidateCustomFields,
    invalidateAllCustomFields,
  };
}