import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { User, Mail, Calendar, Building } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";
import { LoadingSpinner } from "@/components/ui/ISpinner";

export default function Profile() {
  const [match, params] = useRoute("/:username");
  
  const { data: user, isLoading, error } = useQuery<UserType | null>({
    queryKey: [`/api/users/profile/${params?.username}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!params?.username && params.username !== "admin", // Don't show admin profile
    staleTime: 2 * 60 * 1000, // 2 minutes cache for profile data
    gcTime: 5 * 60 * 1000, // Keep profile data for 5 minutes
  });

  if (!match || !params?.username || params.username === "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Profil Bulunamadı</h1>
          <p className="text-gray-500 mt-2">Bu profil görüntülenemiyor.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-60 flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70">
        <div className="flex flex-auto flex-col justify-center items-center p-4 md:p-5">
          <LoadingSpinner size={24} />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Profil Bulunamadı</h1>
          <p className="text-gray-500 mt-2">@{params.username} kullanıcısı bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-lg w-full">
          <div className="text-center">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-gray-500">@{user.username}</p>
            {user.companyName && (
              <p className="text-sm text-gray-600 mt-1">{user.companyName}</p>
            )}
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{user.email}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">
                  {new Date(user.createdAt).toLocaleDateString('tr-TR')} tarihinde katıldı
                </span>
              </div>
              
              {user.companyName && (
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{user.companyName}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700 capitalize">
                  {user.role === "individual" ? "Bireysel" : 
                   user.role === "corporate" ? "Kurumsal" :
                   user.role === "admin" ? "Yönetici" : "Editör"} Hesap
                </span>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Aktiviteler</h3>
              <div className="text-center py-8">
                <p className="text-gray-500">Henüz aktivite bulunmuyor.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}