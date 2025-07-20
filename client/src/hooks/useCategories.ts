import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import type { Category, InsertCategory, UpdateCategory } from "@shared/schema";

// Optimized hook for categories with caching
export function useCategories() {
  return useQuery({
    queryKey: ['/api/categories'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Hook for lazy loading category children
export function useCategoryChildren(parentId: number | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['/api/categories/children', parentId],
    enabled: enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes cache
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Hook for category path with optimized caching
export function useCategoryPath(categoryId: number | null) {
  return useQuery({
    queryKey: ['/api/categories', categoryId, 'path'],
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Hook for categories tree data
export function useCategoriesTree() {
  return useQuery({
    queryKey: ['/api/categories'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Mutation hooks for categories
export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InsertCategory) => apiRequest(`/api/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategory }) => 
      apiRequest(`/api/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiRequest(`/api/categories/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
  });
}

// Cache invalidation helper
export function useCategoriesCache() {
  const queryClient = useQueryClient();

  const invalidateCategories = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
  };

  const invalidateCategoryChildren = (parentId: number | null) => {
    queryClient.invalidateQueries({ queryKey: ['/api/categories/children', parentId] });
  };

  const invalidateCategoryPath = (categoryId: number) => {
    queryClient.invalidateQueries({ queryKey: ['/api/categories', categoryId, 'path'] });
  };

  const invalidateAllCategories = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
  };

  return {
    invalidateCategories,
    invalidateCategoryChildren,
    invalidateCategoryPath,
    invalidateAllCategories,
  };
}