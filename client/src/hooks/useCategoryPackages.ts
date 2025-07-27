import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CategoryPackage, InsertCategoryPackage, UpdateCategoryPackage } from "@shared/schema";

interface UseCategoryPackagesOptions {
  onCreateSuccess?: () => void;
  onUpdateSuccess?: () => void;
}

export function useCategoryPackages(categoryId: number, options?: UseCategoryPackagesOptions) {
  const queryClient = useQueryClient();

  // Get category packages
  const {
    data: packages = [],
    isLoading,
    error,
  } = useQuery<CategoryPackage[]>({
    queryKey: ["/api/categories", categoryId, "packages"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create package mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<InsertCategoryPackage, "categoryId">): Promise<CategoryPackage> => {
      const response = await fetch(`/api/categories/${categoryId}/packages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Paket oluşturulamadı');
      }
      
      return response.json();
    },
    onSuccess: (newPackage) => {
      console.log("✅ CREATE SUCCESS - Paket oluşturuldu:", newPackage);
      queryClient.invalidateQueries({
        queryKey: ["/api/categories", categoryId, "packages"],
      });
      options?.onCreateSuccess?.();
    },
    onError: (error) => {
      console.error("❌ CREATE ERROR:", error);
      alert("Paket oluşturulurken hata oluştu: " + error.message);
    },
  });

  // Update package mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateCategoryPackage): Promise<CategoryPackage> => {
      const response = await fetch(`/api/category-packages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Paket güncellenemedi');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/categories", categoryId, "packages"],
      });
      options?.onUpdateSuccess?.();
    },
    onError: (error) => {
      console.error("Update package error:", error);
      alert("Paket güncellenirken hata oluştu: " + error.message);
    },
  });

  // Delete package mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`/api/category-packages/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Paket silinemedi');
      }
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
    mutationFn: async (packageIds: number[]): Promise<void> => {
      const response = await fetch(`/api/categories/${categoryId}/packages/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageIds }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Paketler sıralanamadı');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/categories", categoryId, "packages"],
      });
    },
  });

  return {
    packages: packages as CategoryPackage[],
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