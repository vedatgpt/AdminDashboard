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
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            alt="Logo"
            src={logoPath}
            className="mx-auto h-10 w-auto"
          />
          <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
            Hesabınıza giriş yapın
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
            <div>
              <label htmlFor="emailOrUsername" className="block text-sm/6 font-medium text-gray-900">
                E-posta adresi veya kullanıcı adı
              </label>
              <div className="mt-2">
                <input
                  id="emailOrUsername"
                  type="text"
                  {...loginForm.register("emailOrUsername")}
                  required
                  autoComplete="email"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#EC7830] sm:text-sm/6"
                  placeholder="E-posta adresinizi veya kullanıcı adınızı giriniz"
                />
                {loginForm.formState.errors.emailOrUsername && (
                  <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.emailOrUsername.message}</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
                  Şifre
                </label>
                <div className="text-sm">
                  <a href="#" className="font-semibold text-[#EC7830] hover:text-[#EC7830]/80">
                    Şifrenizi mi unuttunuz?
                  </a>
                </div>
              </div>
              <div className="mt-2 relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...loginForm.register("password")}
                  required
                  autoComplete="current-password"
                  className="block w-full rounded-md bg-white px-3 py-1.5 pr-10 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#EC7830] sm:text-sm/6"
                  placeholder="Şifrenizi giriniz"
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
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loginLoading}
                className="flex w-full justify-center rounded-md bg-[#EC7830] px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-[#EC7830]/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC7830] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm/6 text-gray-500">
            Hesabınız yok mu?{' '}
            <Link href="/register" className="font-semibold text-[#EC7830] hover:text-[#EC7830]/80">
              Kayıt olun
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}