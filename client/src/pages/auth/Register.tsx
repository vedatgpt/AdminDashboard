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
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card w-full max-w-md shadow-2xl bg-base-100">
        <div className="card-body">
          <div className="text-center mb-6">
            <img
              alt="Logo"
              src={logoPath}
              className="mx-auto h-12 w-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-base-content">Kayıt Ol</h1>
            <p className="text-base-content/70 mt-2">Yeni hesap oluşturun</p>
          </div>

          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Hesap Türü</span>
              </label>
              <select 
                {...registerForm.register("role")}
                className="select select-bordered w-full"
              >
                <option value="individual">Bireysel</option>
                <option value="corporate">Kurumsal</option>
              </select>
              {registerForm.formState.errors.role && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {registerForm.formState.errors.role.message}
                  </span>
                </label>
              )}
            </div>
            
            {registerForm.watch("role") === "corporate" && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Firma Adı</span>
                </label>
                <input
                  type="text"
                  {...registerForm.register("companyName")}
                  placeholder="Firma adınızı giriniz"
                  className="input input-bordered w-full"
                />
                {registerForm.formState.errors.companyName && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {registerForm.formState.errors.companyName.message}
                    </span>
                  </label>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Ad</span>
                </label>
                <input
                  type="text"
                  {...registerForm.register("firstName")}
                  placeholder="Adınız"
                  className="input input-bordered w-full"
                  required
                />
                {registerForm.formState.errors.firstName && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {registerForm.formState.errors.firstName.message}
                    </span>
                  </label>
                )}
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Soyad</span>
                </label>
                <input
                  type="text"
                  {...registerForm.register("lastName")}
                  placeholder="Soyadınız"
                  className="input input-bordered w-full"
                  required
                />
                {registerForm.formState.errors.lastName && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {registerForm.formState.errors.lastName.message}
                    </span>
                  </label>
                )}
              </div>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">E-posta Adresi</span>
              </label>
              <input
                type="email"
                {...registerForm.register("email")}
                placeholder="E-posta adresinizi giriniz"
                className="input input-bordered w-full"
                required
              />
              {registerForm.formState.errors.email && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {registerForm.formState.errors.email.message}
                  </span>
                </label>
              )}
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Şifre</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...registerForm.register("password")}
                  placeholder="Şifrenizi giriniz (en az 6 karakter)"
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
              {registerForm.formState.errors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {registerForm.formState.errors.password.message}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control mt-6">
              <button
                type="submit"
                disabled={registerLoading}
                className={`btn btn-primary w-full ${registerLoading ? 'loading' : ''}`}
              >
                {registerLoading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
              </button>
            </div>
          </form>

          <div className="divider">veya</div>
          
          <div className="text-center">
            <p className="text-base-content/70">
              Zaten hesabınız var mı?{' '}
              <Link href="/login" className="link link-primary font-semibold">
                Giriş yapın
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}