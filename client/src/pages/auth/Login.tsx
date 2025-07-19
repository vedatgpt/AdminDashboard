import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import logoPath from "@assets/logo_1752808818099.png";

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login, loginError, loginLoading, user, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") {
        navigate("/admin/users");
      } else {
        navigate("/");
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Don't show login page if already authenticated
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg">Yönlendiriliyor...</div>
      </div>
    );
  }

  const handleLogin = async (data: LoginData) => {
    try {
      await login(data);
      toast({
        title: "Başarılı",
        description: "Giriş yapıldı",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Giriş başarısız",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-center mb-4">
            <img src={logoPath} alt="Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900">
            Giriş Yap
          </h1>
        </div>
        <div className="p-6">
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700">
                E-posta Adresi
              </label>
              <input
                id="emailOrUsername"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="E-posta adresinizi girin"
                {...loginForm.register("emailOrUsername")}
              />
              {loginForm.formState.errors.emailOrUsername && (
                <p className="text-sm text-red-500">
                  {loginForm.formState.errors.emailOrUsername.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Şifre
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Şifrenizi girin"
                  {...loginForm.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>

            {loginError && (
              <p className="text-sm text-red-500 text-center">
                {loginError}
              </p>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Hesabınız yok mu?{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:text-opacity-80"
              >
                Kayıt olun
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}