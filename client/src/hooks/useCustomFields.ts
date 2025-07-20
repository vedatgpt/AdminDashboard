import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CategoryCustomField, InsertCustomField } from "@shared/schema";

export function useCategoryCustomFields(categoryId: number) {
  return useQuery<CategoryCustomField[]>({
    queryKey: ["/api/categories", categoryId, "custom-fields"],
    queryFn: () => fetch(`/api/categories/${categoryId}/custom-fields`).then(res => {
      if (!res.ok) throw new Error('Failed to fetch custom fields');
      return res.json();
    }),
    enabled: !!categoryId,
  });
}

export function useCreateCustomField(categoryId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<InsertCustomField, 'categoryId'>) => 
      fetch(`/api/categories/${categoryId}/custom-fields`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${res.status}: Failed to create custom field`);
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories", categoryId, "custom-fields"] });
    },
  });
}

export function useUpdateCustomField(categoryId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ fieldId, data }: { fieldId: number; data: Partial<InsertCustomField> }) =>
      fetch(`/api/categories/custom-fields/${fieldId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${res.status}: Failed to update custom field`);
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories", categoryId, "custom-fields"] });
    },
  });
}

export function useDeleteCustomField(categoryId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (fieldId: number) =>
      fetch(`/api/categories/custom-fields/${fieldId}`, {
        method: "DELETE",
      }).then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${res.status}: Failed to delete custom field`);
        }
        return res.ok;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories", categoryId, "custom-fields"] });
    },
  });
}

// Alias for backward compatibility
export const useCustomFields = useCategoryCustomFields;