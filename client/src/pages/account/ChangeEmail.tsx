import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const emailSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
});

type EmailData = z.infer<typeof emailSchema>;

export default function ChangeEmail() {
  const { user, refreshUser, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const emailForm = useForm<EmailData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user?.email || "",
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: async (data: EmailData) => {
      const response = await fetch("/api/user/change-email", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "E-posta güncellenirken hata oluştu");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Başarılı",
        description: "E-posta adresiniz güncellendi",
      });
      emailForm.reset({ email: data.email });
      queryClient.setQueryData(["/api/auth/me"], data);
      queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "E-posta güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleEmailUpdate = (data: EmailData) => {
    updateEmailMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-60 flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70">
        <div className="flex flex-auto flex-col justify-center items-center p-4 md:p-5">
          <div className="flex justify-center">
            <div className="animate-spin inline-block size-6 border-3 border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500" role="status" aria-label="loading">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">E-posta Değişikliği</h1>
          <p className="text-gray-600 mt-2">E-posta adresinizi günceleyin</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              E-posta Adresi Güncelle
            </h2>
            <p className="text-gray-600 mt-1">
              Yeni e-posta adresinizi buradan güncelleyebilirsiniz
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={emailForm.handleSubmit(handleEmailUpdate)} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Yeni E-posta Adresi
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="yeni@email.com"
                  {...emailForm.register("email")}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <button 
                type="submit" 
                disabled={updateEmailMutation.isPending}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateEmailMutation.isPending ? "Güncelleniyor..." : "E-postayı Güncelle"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}