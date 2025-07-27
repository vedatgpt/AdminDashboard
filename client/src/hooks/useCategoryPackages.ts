import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CategoryPackage, InsertCategoryPackage, UpdateCategoryPackage } from "@shared/schema";

export function useCategoryPackages(categoryId: number) {
  const queryClient = useQueryClient();

  // Get category packages
  const {
    data: packages = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/categories", categoryId, "packages"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create package mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<InsertCategoryPackage, "categoryId">) => {
      return apiRequest(`/api/categories/${categoryId}/packages`, {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/categories", categoryId, "packages"],
      });
    },
    onError: (error) => {
      console.error("Create package error:", error);
    },
  });

  // Update package mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateCategoryPackage) => {
      return apiRequest(`/api/category-packages/${id}`, {
        method: "PATCH",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/categories", categoryId, "packages"],
      });
    },
    onError: (error) => {
      console.error("Update package error:", error);
    },
  });

  // Delete package mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/category-packages/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/categories", categoryId, "packages"],
      });
    },
    onError: (error) => {
      console.error("Delete package error:", error);
    },
  });

  // Reorder packages mutation
  const reorderMutation = useMutation({
    mutationFn: async (packageIds: number[]) => {
      return apiRequest(`/api/categories/${categoryId}/packages/reorder`, {
        method: "PATCH",
        body: { packageIds },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/categories", categoryId, "packages"],
      });
    },
  });

  return {
    packages,
    isLoading,
    error,
    createPackage: createMutation.mutate,
    updatePackage: updateMutation.mutate,
    deletePackage: deleteMutation.mutate,
    reorderPackages: reorderMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
}