import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { AuthorizedPersonnel, InsertAuthorizedPersonnel } from "@shared/schema";

export function useAuthorizedPersonnel() {
  const queryClient = useQueryClient();

  const { data: personnel = [], isLoading, error } = useQuery<AuthorizedPersonnel[]>({
    queryKey: ["/api/authorized-personnel"],
    retry: false,
  });

  const createPersonnelMutation = useMutation({
    mutationFn: async (personnelData: InsertAuthorizedPersonnel) => {
      return await apiRequest("/api/authorized-personnel", {
        method: "POST",
        body: JSON.stringify(personnelData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authorized-personnel"] });
    },
  });

  const updatePersonnelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAuthorizedPersonnel> }) => {
      return await apiRequest(`/api/authorized-personnel/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authorized-personnel"] });
    },
  });

  const deletePersonnelMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/authorized-personnel/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authorized-personnel"] });
    },
  });

  return {
    personnel,
    isLoading,
    error,
    createPersonnel: createPersonnelMutation.mutateAsync,
    updatePersonnel: updatePersonnelMutation.mutateAsync,
    deletePersonnel: deletePersonnelMutation.mutateAsync,
    isCreating: createPersonnelMutation.isPending,
    isUpdating: updatePersonnelMutation.isPending,
    isDeleting: deletePersonnelMutation.isPending,
    createError: createPersonnelMutation.error,
    updateError: updatePersonnelMutation.error,
    deleteError: deletePersonnelMutation.error,
  };
}