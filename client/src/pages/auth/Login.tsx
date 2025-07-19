import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { AuthButton } from "@/components/auth/AuthButton";
import { PasswordField } from "@/components/auth/PasswordField";

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login, loginLoading, user, isAuthenticated } = useAuth();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { emailOrUsername: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "admin" ? "/admin/users" : "/");
    }
  }, [isAuthenticated, user, navigate]);

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg">Yönlendiriliyor...</div>
      </div>
    );
  }

  const handleSubmit = async (data: LoginData) => {
    try {
      await login(data);
      toast({ title: "Başarılı", description: "Giriş yapıldı" });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Giriş başarısız",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthLayout 
      title="Giriş Yap"
      linkText="Hesabınız yok mu? Kayıt olun"
      linkHref="/register"
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <AuthTextField
          label="E-posta veya Kullanıcı Adı"
          placeholder="E-posta adresinizi veya kullanıcı adınızı giriniz"
          error={!!form.formState.errors.emailOrUsername}
          helperText={form.formState.errors.emailOrUsername?.message}
          {...form.register("emailOrUsername")}
        />
        
        <PasswordField
          label="Şifre"
          placeholder="Şifrenizi giriniz"
          error={!!form.formState.errors.password}
          helperText={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        
        <AuthButton type="submit" loading={loginLoading}>
          {loginLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}