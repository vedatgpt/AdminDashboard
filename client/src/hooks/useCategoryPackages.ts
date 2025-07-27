import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface CategoryPackage {
  id: number;
  name: string;
  description: string | null;
  basePrice: number;
  durationDays: number;
  features: string | null;
  maxPhotos: number;
  membershipType: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  categoryPrice: number;
  categoryPackageId: number;
}

export interface CreateCategoryPackageData {
  packageId: number;
  price: number;
}

export interface UpdateCategoryPackageData {
  price: number;
}

// Fetch category packages
export function useCategoryPackages(categoryId: number) {
  return useQuery({
    queryKey: ['/api/categories', categoryId, 'packages'],
    enabled: !!categoryId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Create category package mutation
export function useCreateCategoryPackage(categoryId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCategoryPackageData): Promise<CategoryPackage> => {
      const response = await fetch(`/api/categories/${categoryId}/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kategori paketi oluşturulamadı');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories', categoryId, 'packages'] });
    },
  });
}

// Update category package mutation
export function useUpdateCategoryPackage(categoryId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateCategoryPackageData & { id: number }): Promise<CategoryPackage> => {
      const response = await fetch(`/api/categories/${categoryId}/packages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kategori paketi güncellenemedi');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories', categoryId, 'packages'] });
    },
  });
}

// Delete category package mutation
export function useDeleteCategoryPackage(categoryId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`/api/categories/${categoryId}/packages/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kategori paketi silinemedi');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories', categoryId, 'packages'] });
    },
  });
}

// Fetch all listing packages (for selecting which package to assign to category)
export function useListingPackages() {
  return useQuery({
    queryKey: ['/api/listing-packages'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}