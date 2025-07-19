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
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img 
          src={logoPath} 
          alt="Logo" 
          className="mx-auto h-10 w-auto" 
        />
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          Yeni hesap oluşturun
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
          <div>
            <label htmlFor="role" className="block text-sm/6 font-medium text-gray-900">
              Hesap Türü
            </label>
            <div className="mt-2">
              <select 
                id="role"
                {...registerForm.register("role")}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-[#EC7830] sm:text-sm/6"
              >
                <option value="individual">Bireysel</option>
                <option value="corporate">Kurumsal</option>
              </select>
              {registerForm.formState.errors.role && (
                <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.role.message}</p>
              )}
            </div>
          </div>
          
          {registerForm.watch("role") === "corporate" && (
            <div>
              <label htmlFor="companyName" className="block text-sm/6 font-medium text-gray-900">
                Firma Adı
              </label>
              <div className="mt-2">
                <input
                  id="companyName"
                  type="text"
                  {...registerForm.register("companyName")}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#EC7830] sm:text-sm/6"
                  placeholder="Firma adınızı giriniz"
                />
                {registerForm.formState.errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.companyName.message}</p>
                )}
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="firstName" className="block text-sm/6 font-medium text-gray-900">
              Ad
            </label>
            <div className="mt-2">
              <input
                id="firstName"
                type="text"
                {...registerForm.register("firstName")}
                required
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#EC7830] sm:text-sm/6"
                placeholder="Adınızı giriniz"
              />
              {registerForm.formState.errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.firstName.message}</p>
              )}
            </div>
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm/6 font-medium text-gray-900">
              Soyad
            </label>
            <div className="mt-2">
              <input
                id="lastName"
                type="text"
                {...registerForm.register("lastName")}
                required
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#EC7830] sm:text-sm/6"
                placeholder="Soyadınızı giriniz"
              />
              {registerForm.formState.errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
              E-posta adresi
            </label>
            <div className="mt-2">
              <input
                id="email"
                type="email"
                {...registerForm.register("email")}
                required
                autoComplete="email"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#EC7830] sm:text-sm/6"
                placeholder="E-posta adresinizi giriniz"
              />
              {registerForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.email.message}</p>
              )}
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
              Şifre
            </label>
            <div className="mt-2 relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                {...registerForm.register("password")}
                required
                autoComplete="new-password"
                className="block w-full rounded-md bg-white px-3 py-1.5 pr-10 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#EC7830] sm:text-sm/6"
                placeholder="Şifrenizi giriniz (en az 6 karakter)"
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
              {registerForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={registerLoading}
              className="flex w-full justify-center rounded-md bg-[#EC7830] px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-[#EC7830]/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC7830] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registerLoading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm/6 text-gray-500">
          Zaten hesabınız var mı?
          <Link href="/login" className="font-semibold text-[#EC7830] hover:text-[#EC7830]/80 ml-1">
            Giriş yapın
          </Link>
        </p>
      </div>
    </div>
  );
}