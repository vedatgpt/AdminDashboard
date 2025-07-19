import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Category, InsertCategory, UpdateCategory } from "@shared/schema";

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
}

export function useCategoriesTree() {
  return useQuery<Category[]>({
    queryKey: ["/api/categories", "tree"],
    queryFn: () => fetch("/api/categories").then(res => {
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }),
  });
}

export function useCategory(id: number) {
  return useQuery<Category & { customFields?: any[] }>({
    queryKey: ["/api/categories", id],
    enabled: !!id,
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
      }).then(res => {
        if (!res.ok) throw new Error('Failed to create category');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
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
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update category');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/categories/${id}`, {
        method: "DELETE",
      }).then(res => {
        if (!res.ok) throw new Error('Failed to delete category');
        return res.ok;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
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