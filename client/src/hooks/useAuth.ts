import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import type { User, LoginData, RegisterData } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 10 * 1000, // 10 seconds - faster auth updates
    refetchOnWindowFocus: false, // Reduce unnecessary API calls
    refetchOnMount: true, // DO refetch on mount for faster auth checks
    refetchOnReconnect: true,
    gcTime: 1 * 60 * 1000, // 1 minute cache time - faster clearing
  });

  const loginMutation = useMutation({
    mutationFn: async (loginData: LoginData) => {
      try {
        const response = await apiRequest("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(loginData),
        });
        return response;
      } catch (error: any) {
        // Parse server error response
        if (error.message && error.message.includes(":")) {
          const errorText = error.message.split(": ")[1];
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || "Giriş başarısız");
          } catch {
            throw new Error(errorText || "Giriş başarısız");
          }
        }
        throw new Error("Giriş başarısız");
      }
    },
    onSuccess: () => {
      // Selective cache clearing - only user-specific data
      queryClient.removeQueries({ queryKey: ["/api/draft-listings"] });
      queryClient.removeQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (registerData: RegisterData) => {
      try {
        const response = await apiRequest("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(registerData),
        });
        return response;
      } catch (error: any) {
        // Parse server error response
        if (error.message && error.message.includes(":")) {
          const errorText = error.message.split(": ")[1];
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || "Kayıt başarısız");
          } catch {
            throw new Error(errorText || "Kayıt başarısız");
          }
        }
        throw new Error("Kayıt başarısız");
      }
    },
    onSuccess: () => {
      // Selective cache clearing - only user-specific data
      queryClient.removeQueries({ queryKey: ["/api/draft-listings"] });
      queryClient.removeQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/auth/logout", {
        method: "POST",
      });
    },
    onSuccess: () => {
      // Fast selective clearing - only user-specific data
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.removeQueries({ queryKey: ["/api/draft-listings"] });
      queryClient.removeQueries({ 
        predicate: (query) => 
          Array.isArray(query.queryKey) && 
          query.queryKey[0] === "/api/draft-listings"
      });
    },
  });

  const refreshUser = async () => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    refreshUser,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    loginLoading: loginMutation.isPending,
    registerLoading: registerMutation.isPending,
  };
}