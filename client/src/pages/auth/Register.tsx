import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, type RegisterData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import logoPath from "@assets/logo_1752808818099.png";

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { register, registerError, registerLoading, user, isAuthenticated } = useAuth();

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
    <section className="bg-white dark:bg-gray-900">
      <div className="container flex items-center justify-center min-h-screen px-6 mx-auto">
        <div className="w-full max-w-md">
          <img 
            className="w-auto h-7 sm:h-8" 
            src={logoPath} 
            alt="Logo"
          />

          <h1 className="mt-3 text-2xl font-semibold text-gray-800 capitalize sm:text-3xl dark:text-white">
            Kayıt Ol
          </h1>

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Hesabınız var mı? {" "}
            <Link href="/login" className="text-blue-500 hover:underline dark:text-blue-400">
              Giriş yapın
            </Link>
          </p>

          <form className="mt-6" onSubmit={registerForm.handleSubmit(handleRegister)}>
            <div className="grid gap-y-4">
              <div>
                <label htmlFor="role" className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Hesap Türü</label>
                <select 
                  id="role"
                  {...registerForm.register("role")}
                  className="block w-full py-3 text-gray-700 bg-white border rounded-lg px-4 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
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
                  <label htmlFor="companyName" className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Firma Adı</label>
                  <input
                    type="text"
                    id="companyName"
                    {...registerForm.register("companyName")}
                    className="block w-full py-3 text-gray-700 bg-white border rounded-lg px-4 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                    placeholder="Firma adınızı giriniz"
                  />
                  {registerForm.formState.errors.companyName && (
                    <p className="text-xs text-red-600 mt-2">{registerForm.formState.errors.companyName.message}</p>
                  )}
                </div>
              )}
              
              <div>
                <label htmlFor="firstName" className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Ad</label>
                <input
                  type="text"
                  id="firstName"
                  {...registerForm.register("firstName")}
                  className="block w-full py-3 text-gray-700 bg-white border rounded-lg px-4 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                  placeholder="Adınızı giriniz"
                />
                {registerForm.formState.errors.firstName && (
                  <p className="text-xs text-red-600 mt-2">{registerForm.formState.errors.firstName.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Soyad</label>
                <input
                  type="text"
                  id="lastName"
                  {...registerForm.register("lastName")}
                  className="block w-full py-3 text-gray-700 bg-white border rounded-lg px-4 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                  placeholder="Soyadınızı giriniz"
                />
                {registerForm.formState.errors.lastName && (
                  <p className="text-xs text-red-600 mt-2">{registerForm.formState.errors.lastName.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm text-gray-700 dark:text-gray-300 mb-2">E-posta</label>
                <input
                  type="email"
                  id="email"
                  {...registerForm.register("email")}
                  className="block w-full py-3 text-gray-700 bg-white border rounded-lg px-4 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                  placeholder="E-posta adresinizi giriniz"
                />
                {registerForm.formState.errors.email && (
                  <p className="text-xs text-red-600 mt-2">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Şifre</label>
                <input
                  type="password"
                  id="password"
                  {...registerForm.register("password")}
                  className="block w-full py-3 text-gray-700 bg-white border rounded-lg px-4 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                  placeholder="Şifrenizi giriniz"
                />
                {registerForm.formState.errors.password && (
                  <p className="text-xs text-red-600 mt-2">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={registerLoading}
                className="w-full px-6 py-3 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-blue-500 rounded-lg hover:bg-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-50 disabled:opacity-50"
              >
                {registerLoading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}