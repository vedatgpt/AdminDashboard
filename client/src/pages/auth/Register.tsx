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
      // Error'u string'e çevir
      let errorMessage = 'Kayıt başarısız';
      if (error && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const selectedRole = registerForm.watch("role");

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-center text-gray-900">
            Hesap Aç
          </h1>
        </div>
        <div>
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            <div className="relative">
              <select
                id="role"
                className="peer p-4 pe-9 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none focus:pt-6 focus:pb-2 [&:not(:placeholder-shown)]:pt-6 [&:not(:placeholder-shown)]:pb-2"
                {...registerForm.register("role")}
              >
                <option value="" disabled hidden></option>
                <option value="individual">Bireysel</option>
                <option value="corporate">Kurumsal</option>
              </select>
              <label 
                htmlFor="role"
                className="absolute top-0 start-0 p-4 h-full text-sm truncate pointer-events-none transition ease-in-out duration-100 border border-transparent origin-[0_0] peer-disabled:opacity-50 peer-disabled:pointer-events-none peer-focus:scale-90 peer-focus:translate-x-0.5 peer-focus:-translate-y-1.5 peer-focus:text-gray-500 peer-[&:not(:placeholder-shown)]:scale-90 peer-[&:not(:placeholder-shown)]:translate-x-0.5 peer-[&:not(:placeholder-shown)]:-translate-y-1.5 peer-[&:not(:placeholder-shown)]:text-gray-500 text-gray-500"
              >
                Hesap Türü
              </label>
            </div>

            {selectedRole === "corporate" && (
              <div className="relative">
                <input
                  id="companyName"
                  type="text"
                  className="peer p-4 block w-full border-gray-200 rounded-lg text-sm placeholder:text-transparent focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none focus:pt-6 focus:pb-2 [&:not(:placeholder-shown)]:pt-6 [&:not(:placeholder-shown)]:pb-2 autofill:pt-6 autofill:pb-2"
                  placeholder="Şirket adını girin"
                  {...registerForm.register("companyName")}
                />
                <label 
                  htmlFor="companyName"
                  className="absolute top-0 start-0 p-4 h-full text-sm truncate pointer-events-none transition ease-in-out duration-100 border border-transparent origin-[0_0] peer-disabled:opacity-50 peer-disabled:pointer-events-none peer-focus:scale-90 peer-focus:translate-x-0.5 peer-focus:-translate-y-1.5 peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:translate-x-0.5 peer-[:not(:placeholder-shown)]:-translate-y-1.5 peer-[:not(:placeholder-shown)]:text-gray-500 text-gray-500"
                >
                  Şirket Adı
                </label>
                {registerForm.formState.errors.companyName && (
                  <p className="text-sm text-red-500 mt-1">
                    {registerForm.formState.errors.companyName.message}
                  </p>
                )}
              </div>
            )}

            <div className="relative">
              <input
                id="username"
                type="text"
                className="peer p-4 block w-full border-gray-200 rounded-lg text-sm placeholder:text-transparent focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none focus:pt-6 focus:pb-2 [&:not(:placeholder-shown)]:pt-6 [&:not(:placeholder-shown)]:pb-2 autofill:pt-6 autofill:pb-2"
                placeholder="Kullanıcı adınızı girin"
                {...registerForm.register("username")}
              />
              <label 
                htmlFor="username"
                className="absolute top-0 start-0 p-4 h-full text-sm truncate pointer-events-none transition ease-in-out duration-100 border border-transparent origin-[0_0] peer-disabled:opacity-50 peer-disabled:pointer-events-none peer-focus:scale-90 peer-focus:translate-x-0.5 peer-focus:-translate-y-1.5 peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:translate-x-0.5 peer-[:not(:placeholder-shown)]:-translate-y-1.5 peer-[:not(:placeholder-shown)]:text-gray-500 text-gray-500"
              >
                Kullanıcı Adı
              </label>
              {registerForm.formState.errors.username && (
                <p className="text-sm text-red-500 mt-1">
                  {registerForm.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input
                  id="firstName"
                  type="text"
                  className="peer p-4 block w-full border-gray-200 rounded-lg text-sm placeholder:text-transparent focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none focus:pt-6 focus:pb-2 [&:not(:placeholder-shown)]:pt-6 [&:not(:placeholder-shown)]:pb-2 autofill:pt-6 autofill:pb-2"
                  placeholder="Adınızı girin"
                  {...registerForm.register("firstName")}
                />
                <label 
                  htmlFor="firstName"
                  className="absolute top-0 start-0 p-4 h-full text-sm truncate pointer-events-none transition ease-in-out duration-100 border border-transparent origin-[0_0] peer-disabled:opacity-50 peer-disabled:pointer-events-none peer-focus:scale-90 peer-focus:translate-x-0.5 peer-focus:-translate-y-1.5 peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:translate-x-0.5 peer-[:not(:placeholder-shown)]:-translate-y-1.5 peer-[:not(:placeholder-shown)]:text-gray-500 text-gray-500"
                >
                  Ad
                </label>
                {registerForm.formState.errors.firstName && (
                  <p className="text-sm text-red-500 mt-1">
                    {registerForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="relative">
                <input
                  id="lastName"
                  type="text"
                  className="peer p-4 block w-full border-gray-200 rounded-lg text-sm placeholder:text-transparent focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none focus:pt-6 focus:pb-2 [&:not(:placeholder-shown)]:pt-6 [&:not(:placeholder-shown)]:pb-2 autofill:pt-6 autofill:pb-2"
                  placeholder="Soyadınızı girin"
                  {...registerForm.register("lastName")}
                />
                <label 
                  htmlFor="lastName"
                  className="absolute top-0 start-0 p-4 h-full text-sm truncate pointer-events-none transition ease-in-out duration-100 border border-transparent origin-[0_0] peer-disabled:opacity-50 peer-disabled:pointer-events-none peer-focus:scale-90 peer-focus:translate-x-0.5 peer-focus:-translate-y-1.5 peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:translate-x-0.5 peer-[:not(:placeholder-shown)]:-translate-y-1.5 peer-[:not(:placeholder-shown)]:text-gray-500 text-gray-500"
                >
                  Soyad
                </label>
                {registerForm.formState.errors.lastName && (
                  <p className="text-sm text-red-500 mt-1">
                    {registerForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="relative">
              <input
                id="email"
                type="email"
                className="peer p-4 block w-full border-gray-200 rounded-lg text-sm placeholder:text-transparent focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none focus:pt-6 focus:pb-2 [&:not(:placeholder-shown)]:pt-6 [&:not(:placeholder-shown)]:pb-2 autofill:pt-6 autofill:pb-2"
                placeholder="E-posta adresinizi girin"
                {...registerForm.register("email")}
              />
              <label 
                htmlFor="email"
                className="absolute top-0 start-0 p-4 h-full text-sm truncate pointer-events-none transition ease-in-out duration-100 border border-transparent origin-[0_0] peer-disabled:opacity-50 peer-disabled:pointer-events-none peer-focus:scale-90 peer-focus:translate-x-0.5 peer-focus:-translate-y-1.5 peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:translate-x-0.5 peer-[:not(:placeholder-shown)]:-translate-y-1.5 peer-[:not(:placeholder-shown)]:text-gray-500 text-gray-500"
              >
                E-posta
              </label>
              {registerForm.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="peer p-4 pe-12 block w-full border-gray-200 rounded-lg text-sm placeholder:text-transparent focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none focus:pt-6 focus:pb-2 [&:not(:placeholder-shown)]:pt-6 [&:not(:placeholder-shown)]:pb-2 autofill:pt-6 autofill:pb-2"
                placeholder="Şifrenizi girin"
                {...registerForm.register("password")}
              />
              <label 
                htmlFor="password"
                className="absolute top-0 start-0 p-4 h-full text-sm truncate pointer-events-none transition ease-in-out duration-100 border border-transparent origin-[0_0] peer-disabled:opacity-50 peer-disabled:pointer-events-none peer-focus:scale-90 peer-focus:translate-x-0.5 peer-focus:-translate-y-1.5 peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:translate-x-0.5 peer-[:not(:placeholder-shown)]:-translate-y-1.5 peer-[:not(:placeholder-shown)]:text-gray-500 text-gray-500"
              >
                Şifre
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-0 end-0 h-full flex items-center pointer-events-auto z-10 px-3"
              >
                {showPassword ? (
                  <svg className="shrink-0 text-gray-400 size-4" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                    <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                  </svg>
                ) : (
                  <svg className="shrink-0 text-gray-400 size-4" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                  </svg>
                )}
              </button>
              {registerForm.formState.errors.password && (
                <p className="text-sm text-red-500 mt-1">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={registerLoading}
              className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d6691a] focus:outline-hidden focus:bg-[#d6691a] disabled:opacity-50 disabled:pointer-events-none"
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