import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CategoryPackage, InsertCategoryPackage, UpdateCategoryPackage } from "@shared/schema";

// Get category packages for a specific category
export function useCategoryPackages(categoryId: number) {
  return useQuery({
    queryKey: ["category-packages", categoryId],
    queryFn: async (): Promise<CategoryPackage[]> => {
      const response = await fetch(`/api/category-packages/${categoryId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch category packages");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get specific category package by ID
export function useCategoryPackage(id: number) {
  return useQuery({
    queryKey: ["category-packages", "package", id],
    queryFn: async (): Promise<CategoryPackage> => {
      const response = await fetch(`/api/category-packages/package/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch category package");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create new category package
export function useCreateCategoryPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/category-packages/${data.categoryId}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate category packages list for the specific category
      queryClient.invalidateQueries({
        queryKey: ["category-packages", variables.categoryId],
      });
    },
  });
}

// Update category package
export function useUpdateCategoryPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest(`/api/category-packages/package/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      // Invalidate specific package and category packages list
      queryClient.invalidateQueries({
        queryKey: ["category-packages", "package", data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["category-packages", data.categoryId],
      });
    },
  });
}

// Delete category package
export function useDeleteCategoryPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, categoryId }: { id: number; categoryId: number }) => {
      return apiRequest(`/api/category-packages/package/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate category packages list
      queryClient.invalidateQueries({
        queryKey: ["category-packages", variables.categoryId],
      });
      // Remove specific package from cache
      queryClient.removeQueries({
        queryKey: ["category-packages", "package", variables.id],
      });
    },
  });
}

// Reorder category packages
export function useReorderCategoryPackages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, packageIds }: { categoryId: number; packageIds: number[] }) => {
      return apiRequest(`/api/category-packages/${categoryId}/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ packageIds }),
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate category packages list to reflect new order
      queryClient.invalidateQueries({
        queryKey: ["category-packages", variables.categoryId],
      });
    },
  });
}