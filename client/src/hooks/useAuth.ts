import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import type { User, LoginData, RegisterData } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - optimize for performance
    refetchOnWindowFocus: false, // Reduce unnecessary API calls
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: true,
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
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
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
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