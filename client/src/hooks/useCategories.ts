import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Category, InsertCategory, UpdateCategory } from "@shared/schema";

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    gcTime: 10 * 60 * 1000, // 10 minutes in memory
  });
}

export function useCategoriesTree() {
  return useQuery<Category[]>({
    queryKey: ["/api/categories", "tree"],
    queryFn: () => fetch("/api/categories").then(res => {
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    gcTime: 10 * 60 * 1000, // 10 minutes in memory
  });
}

export function useCategory(id: number) {
  return useQuery<Category & { customFields?: any[] }>({
    queryKey: ["/api/categories", id],
    enabled: !!id,
    staleTime: 3 * 60 * 1000, // 3 minutes cache
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InsertCategory) => 
      fetch("/api/categories", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${res.status}: Failed to create category`);
        }
        return res.json();
      }),
    onSuccess: () => {
      // Use selective invalidation instead of all categories
      queryClient.invalidateQueries({ queryKey: ["/api/categories"], exact: false });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategory }) =>
      fetch(`/api/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${res.status}: Failed to update category`);
        }
        return res.json();
      }),
    onSuccess: (updatedCategory, { id }) => {
      // Clear specific category path cache for updated category
      queryClient.removeQueries({ queryKey: ["/api/categories", id, "path"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"], exact: false });
      // Clear session storage cache for this category
      sessionStorage.removeItem(`category-metadata-${id}`);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/categories/${id}`, {
        method: "DELETE",
      }).then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${res.status}: Failed to delete category`);
        }
        return res.ok;
      }),
    onSuccess: (_, deletedId) => {
      // Clean up specific cache entries for deleted category
      queryClient.removeQueries({ queryKey: ["/api/categories", deletedId] });
      queryClient.removeQueries({ queryKey: ["/api/categories", deletedId, "path"] });
      queryClient.removeQueries({ queryKey: ["/api/categories", deletedId, "custom-fields"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"], exact: false });
      // Clear session storage cache
      sessionStorage.removeItem(`category-metadata-${deletedId}`);
    },
  });
}

export function useMoveCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, newParentId }: { id: number; newParentId: number | null }) =>
      fetch(`/api/categories/${id}/move`, {
        method: "PATCH",
        body: JSON.stringify({ newParentId }),
        headers: { "Content-Type": "application/json" },
      }).then(res => {
        if (!res.ok) throw new Error('Failed to move category');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });
}