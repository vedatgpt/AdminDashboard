import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DopingPackage, InsertDopingPackage, UpdateDopingPackage } from "@shared/schema";

// Fetch all doping packages
export function useDopingPackages() {
  return useQuery({
    queryKey: ['/api/doping-packages'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch single doping package by ID
export function useDopingPackage(id: number) {
  return useQuery({
    queryKey: ['/api/doping-packages', id],
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create doping package mutation
export function useCreateDopingPackage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertDopingPackage): Promise<DopingPackage> => {
      const response = await fetch('/api/doping-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Doping paketi oluşturulamadı');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doping-packages'] });
    },
  });
}

// Update doping package mutation
export function useUpdateDopingPackage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateDopingPackage }): Promise<DopingPackage> => {
      const response = await fetch(`/api/doping-packages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Doping paketi güncellenemedi');
      }
      
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/doping-packages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/doping-packages', id] });
    },
  });
}

// Delete doping package mutation
export function useDeleteDopingPackage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number): Promise<{ message: string }> => {
      const response = await fetch(`/api/doping-packages/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Doping paketi silinemedi');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doping-packages'] });
    },
  });
}

// Reorder doping packages mutation
export function useReorderDopingPackages() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (packageIds: number[]): Promise<{ message: string }> => {
      const response = await fetch('/api/doping-packages/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageIds }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Doping paketleri sıralanamadı');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doping-packages'] });
    },
  });
}