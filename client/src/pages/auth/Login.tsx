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
    <div className="h-full">
      <div className="dark:bg-slate-900 bg-gray-100 flex h-full items-center py-16">
        <div className="w-full max-w-md mx-auto p-6">
          <div className="mt-7 bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <div className="p-4 sm:p-7">
              <div className="text-center">
                <img 
                  src={logoPath} 
                  alt="Logo" 
                  className="w-32 h-auto mx-auto mb-6"
                />
                <h1 className="block text-2xl font-bold text-gray-800 dark:text-white">Giriş Yap</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Hesabınız yok mu?
                  <Link href="/register" className="text-blue-600 decoration-2 hover:underline font-medium dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600 ml-1">
                    Kayıt olun
                  </Link>
                </p>
              </div>

              <div className="mt-5">
                <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                  <div className="grid gap-y-4">
                    <div>
                      <label htmlFor="emailOrUsername" className="block text-sm mb-2 dark:text-white">E-posta veya Kullanıcı Adı</label>
                      <div className="relative">
                        <input
                          type="text"
                          id="emailOrUsername"
                          {...loginForm.register("emailOrUsername")}
                          className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-gray-400 dark:focus:ring-gray-600"
                          placeholder="E-posta adresinizi veya kullanıcı adınızı giriniz"
                        />
                        {loginForm.formState.errors.emailOrUsername && (
                          <div className="absolute inset-y-0 end-0 flex items-center pointer-events-none pe-3">
                            <svg className="h-5 w-5 text-red-500" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      {loginForm.formState.errors.emailOrUsername && (
                        <p className="text-xs text-red-600 mt-2">{loginForm.formState.errors.emailOrUsername.message}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <label htmlFor="password" className="block text-sm mb-2 dark:text-white">Şifre</label>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          {...loginForm.register("password")}
                          className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-gray-400 dark:focus:ring-gray-600"
                          placeholder="Şifrenizi giriniz"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 end-0 flex items-center z-20 px-3 cursor-pointer text-gray-400 rounded-e-md focus:outline-none focus:text-blue-600 dark:text-gray-600 dark:focus:text-blue-500"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                        {loginForm.formState.errors.password && (
                          <div className="absolute inset-y-0 end-10 flex items-center pointer-events-none pe-3">
                            <svg className="h-5 w-5 text-red-500" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-xs text-red-600 mt-2">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
                    >
                      {loginLoading ? (
                        <>
                          <span className="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-white rounded-full" role="status" aria-label="loading"></span>
                          Giriş yapılıyor...
                        </>
                      ) : (
                        "Giriş Yap"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}