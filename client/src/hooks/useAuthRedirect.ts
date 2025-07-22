import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook to handle authentication redirects
 * Centralizes the auth redirect logic used across multiple pages
 */
export function useAuthRedirect(redirectTo: string = '/auth/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Giriş Gerekli",
        description: "Bu sayfaya erişmek için giriş yapmanız gerekir",
        variant: "destructive",
      });
      
      setTimeout(() => {
        navigate(redirectTo);
      }, 500);
    }
  }, [isLoading, isAuthenticated, navigate, redirectTo]);

  return { isLoading, isAuthenticated };
}

/**
 * Custom hook for admin-only pages
 */
export function useAdminRedirect(redirectTo: string = '/') {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      toast({
        title: "Yetkisiz Erişim",
        description: "Bu sayfaya erişmek için admin yetkisi gerekir",
        variant: "destructive",
      });
      
      setTimeout(() => {
        navigate(redirectTo);
      }, 500);
    }
  }, [isLoading, user, navigate, redirectTo]);

  return { isLoading, user, isAdmin: user?.role === 'admin' };
}

/**
 * Custom hook for corporate-only pages
 */
export function useCorporateRedirect(redirectTo: string = '/') {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && (!user || (user as any).membershipType !== 'corporate')) {
      toast({
        title: "Kurumsal Üyelik Gerekli",
        description: "Bu sayfaya erişmek için kurumsal üyelik gerekir",
        variant: "destructive",
      });
      
      setTimeout(() => {
        navigate(redirectTo);
      }, 500);
    }
  }, [isLoading, user, navigate, redirectTo]);

  return { isLoading, user, isCorporate: (user as any)?.membershipType === 'corporate' };
}