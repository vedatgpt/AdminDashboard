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
    <div className="min-h-screen bg-base-100 flex items-center justify-center">
      <div className="card w-full max-w-sm shadow-2xl bg-base-100">
        <div className="card-body">
          <div className="text-center mb-6">
            <img
              alt="Logo"
              src={logoPath}
              className="mx-auto h-12 w-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-base-content">Giriş Yap</h1>
            <p className="text-base-content/70 mt-2">Hesabınıza giriş yapın</p>
          </div>

          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">E-posta veya Kullanıcı Adı</span>
              </label>
              <input
                type="text"
                {...loginForm.register("emailOrUsername")}
                placeholder="E-posta adresinizi veya kullanıcı adınızı giriniz"
                className="input input-bordered w-full"
                required
              />
              {loginForm.formState.errors.emailOrUsername && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {loginForm.formState.errors.emailOrUsername.message}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Şifre</span>
                <a href="#" className="label-text-alt link link-hover text-primary">
                  Şifrenizi mi unuttunuz?
                </a>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...loginForm.register("password")}
                  placeholder="Şifrenizi giriniz"
                  className="input input-bordered w-full pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/60 hover:text-base-content"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {loginForm.formState.errors.password.message}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control mt-6">
              <button
                type="submit"
                disabled={loginLoading}
                className={`btn btn-primary w-full ${loginLoading ? 'loading' : ''}`}
              >
                {loginLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </div>
          </form>

          <div className="divider">veya</div>
          
          <div className="text-center">
            <p className="text-base-content/70">
              Hesabınız yok mu?{' '}
              <Link href="/register" className="link link-primary font-semibold">
                Kayıt olun
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}