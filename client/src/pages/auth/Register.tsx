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
  const { register: registerUser, registerError, registerLoading, user, isAuthenticated } = useAuth();
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
      await registerUser(data);
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

  const selectedRole = registerForm.watch("role");

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-lg">
        <div className="p-6 border-b border-gray-200">
         
          <h1 className="text-2xl font-semibold text-center text-gray-900">
            Hesap Aç
          </h1>
        </div>
        <div className="p-6">
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Hesap Türü
              </label>
              <select
                id="role"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                {...registerForm.register("role")}
              >
                <option value="individual">Bireysel</option>
                <option value="corporate">Kurumsal</option>
              </select>
            </div>

            {selectedRole === "corporate" && (
              <div className="space-y-2">
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Şirket Adı
                </label>
                <input
                  id="companyName"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Şirket adını girin"
                  {...registerForm.register("companyName")}
                />
                {registerForm.formState.errors.companyName && (
                  <p className="text-sm text-red-500">
                    {registerForm.formState.errors.companyName.message}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Ad
                </label>
                <input
                  id="firstName"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Adınızı girin"
                  {...registerForm.register("firstName")}
                />
                {registerForm.formState.errors.firstName && (
                  <p className="text-sm text-red-500">
                    {registerForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Soyad
                </label>
                <input
                  id="lastName"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Soyadınızı girin"
                  {...registerForm.register("lastName")}
                />
                {registerForm.formState.errors.lastName && (
                  <p className="text-sm text-red-500">
                    {registerForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-posta
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="E-posta adresinizi girin"
                {...registerForm.register("email")}
              />
              {registerForm.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {registerForm.formState.errors.email.message}
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
                  {...registerForm.register("password")}
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
              {registerForm.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={registerLoading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registerLoading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
            </button>

            {registerError && (
              <p className="text-sm text-red-500 text-center">
                {registerError}
              </p>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Zaten hesabın var mı? {" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:text-opacity-80"
              >
                Giriş yap
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}