import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, type RegisterData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import logoPath from "@assets/logo_1752808818099.png";

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { register, registerError, registerLoading, user, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      password: "",
      email: "",
      firstName: "",
      lastName: "",
      companyName: "",
      role: "individual",
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

  // Don't show register page if already authenticated
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg">Yönlendiriliyor...</div>
      </div>
    );
  }

  const handleRegister = async (data: RegisterData) => {
    try {
      await register(data);
      toast({
        title: "Başarılı",
        description: "Kayıt başarılı",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Kayıt başarısız",
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
                <h1 className="block text-2xl font-bold text-gray-800 dark:text-white">Kayıt Ol</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Hesabınız var mı?
                  <Link href="/login" className="text-blue-600 decoration-2 hover:underline font-medium dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600 ml-1">
                    Giriş yapın
                  </Link>
                </p>
              </div>

              <div className="mt-5">
                <form onSubmit={registerForm.handleSubmit(handleRegister)}>
                  <div className="grid gap-y-4">
                    <div>
                      <label htmlFor="role" className="block text-sm mb-2 dark:text-white">Hesap Türü</label>
                      <select 
                        id="role"
                        {...registerForm.register("role")}
                        className="py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-gray-400 dark:focus:ring-gray-600"
                      >
                        <option value="individual">Bireysel</option>
                        <option value="corporate">Kurumsal</option>
                      </select>
                      {registerForm.formState.errors.role && (
                        <p className="text-xs text-red-600 mt-2">{registerForm.formState.errors.role.message}</p>
                      )}
                    </div>
                    
                    {registerForm.watch("role") === "corporate" && (
                      <div>
                        <label htmlFor="companyName" className="block text-sm mb-2 dark:text-white">Firma Adı</label>
                        <input
                          type="text"
                          id="companyName"
                          {...registerForm.register("companyName")}
                          className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-gray-400 dark:focus:ring-gray-600"
                          placeholder="Firma adınızı giriniz"
                        />
                        {registerForm.formState.errors.companyName && (
                          <p className="text-xs text-red-600 mt-2">{registerForm.formState.errors.companyName.message}</p>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <label htmlFor="firstName" className="block text-sm mb-2 dark:text-white">Ad</label>
                      <input
                        type="text"
                        id="firstName"
                        {...registerForm.register("firstName")}
                        className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-gray-400 dark:focus:ring-gray-600"
                        placeholder="Adınızı giriniz"
                      />
                      {registerForm.formState.errors.firstName && (
                        <p className="text-xs text-red-600 mt-2">{registerForm.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-sm mb-2 dark:text-white">Soyad</label>
                      <input
                        type="text"
                        id="lastName"
                        {...registerForm.register("lastName")}
                        className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-gray-400 dark:focus:ring-gray-600"
                        placeholder="Soyadınızı giriniz"
                      />
                      {registerForm.formState.errors.lastName && (
                        <p className="text-xs text-red-600 mt-2">{registerForm.formState.errors.lastName.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm mb-2 dark:text-white">E-posta</label>
                      <input
                        type="email"
                        id="email"
                        {...registerForm.register("email")}
                        className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-gray-400 dark:focus:ring-gray-600"
                        placeholder="E-posta adresinizi giriniz"
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-xs text-red-600 mt-2">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="password" className="block text-sm mb-2 dark:text-white">Şifre</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          {...registerForm.register("password")}
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
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="text-xs text-red-600 mt-2">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={registerLoading}
                      className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
                    >
                      {registerLoading ? (
                        <>
                          <span className="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-white rounded-full" role="status" aria-label="loading"></span>
                          Kayıt yapılıyor...
                        </>
                      ) : (
                        "Kayıt Ol"
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