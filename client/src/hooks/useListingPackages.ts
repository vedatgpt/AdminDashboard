import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ListingPackage, InsertListingPackage, UpdateListingPackage, ListingPackageWithPricing, ListingPackageCategoryPricing, InsertListingPackageCategoryPricing, UpdateListingPackageCategoryPricing } from "@shared/schema";

// Fetch all listing packages (optionally filtered by membership type)
export function useListingPackages(membershipType?: 'individual' | 'corporate') {
  return useQuery<ListingPackage[]>({
    queryKey: membershipType 
      ? ['/api/listing-packages', { membershipType }] 
      : ['/api/listing-packages'],
    queryFn: async () => {
      const url = membershipType 
        ? `/api/listing-packages?membershipType=${membershipType}`
        : '/api/listing-packages';
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'İlan paketleri alınamadı');
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch single listing package by ID
export function useListingPackage(id: number) {
  return useQuery({
    queryKey: ['/api/listing-packages', id],
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch listing package with pricing
export function useListingPackageWithPricing(id: number) {
  return useQuery({
    queryKey: ['/api/listing-packages', id, 'with-pricing'],
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create listing package mutation
export function useCreateListingPackage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertListingPackage): Promise<ListingPackage> => {
      const response = await fetch('/api/listing-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'İlan paketi oluşturulamadı');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listing-packages'] });
    },
  });
}

// Update listing package mutation
export function useUpdateListingPackage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateListingPackage }): Promise<ListingPackage> => {
      const response = await fetch(`/api/listing-packages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'İlan paketi güncellenemedi');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listing-packages'] });
    },
  });
}

// Delete listing package mutation
export function useDeleteListingPackage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`/api/listing-packages/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'İlan paketi silinemedi');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listing-packages'] });
    },
  });
}

// Reorder listing packages mutation
export function useReorderListingPackages() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (packageIds: number[]): Promise<void> => {
      const response = await fetch('/api/listing-packages/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageIds }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'İlan paketleri yeniden sıralanamadı');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listing-packages'] });
    },
  });
}

// ===== LISTING PACKAGE CATEGORY PRICING HOOKS =====

// Fetch category pricing for a package
export function usePackageCategoryPricing(packageId: number) {
  return useQuery({
    queryKey: ['/api/listing-packages', packageId, 'category-pricing'],
    enabled: !!packageId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create package category pricing mutation
export function useCreatePackageCategoryPricing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertListingPackageCategoryPricing): Promise<ListingPackageCategoryPricing> => {
      const response = await fetch('/api/listing-package-category-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kategori fiyatı oluşturulamadı');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/listing-packages', data.packageId, 'category-pricing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/listing-packages'] });
    },
  });
}

// Update package category pricing mutation
export function useUpdatePackageCategoryPricing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateListingPackageCategoryPricing }): Promise<ListingPackageCategoryPricing> => {
      const response = await fetch(`/api/listing-package-category-pricing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kategori fiyatı güncellenemedi');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/listing-packages', data.packageId, 'category-pricing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/listing-packages'] });
    },
  });
}

// Delete package category pricing mutation
export function useDeletePackageCategoryPricing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`/api/listing-package-category-pricing/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kategori fiyatı silinemedi');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listing-packages'] });
    },
  });
}