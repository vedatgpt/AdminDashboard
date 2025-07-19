import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const emailSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
});

type EmailData = z.infer<typeof emailSchema>;

export default function ChangeEmail() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      // Update form with new email
      emailForm.reset({ email: data.email });
      // Update the cached user data immediately
      queryClient.setQueryData(["/api/auth/me"], data);
      // Force a refetch to ensure sync
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Yetkisiz Erişim</h1>
          <p className="text-gray-500 mt-2">Bu sayfaya erişim için giriş yapmanız gerekiyor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">E-posta Değişikliği</h1>
          <p className="text-gray-600 mt-2">E-posta adresinizi günceleyin</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              E-posta Adresi
            </CardTitle>
            <CardDescription>
              Hesabınıza bağlı e-posta adresini değiştirebilirsiniz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={emailForm.handleSubmit(handleEmailUpdate)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Yeni E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  {...emailForm.register("email")}
                  placeholder="Yeni e-posta adresiniz"
                />
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={updateEmailMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateEmailMutation.isPending ? "Güncelleniyor..." : "E-posta Güncelle"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}