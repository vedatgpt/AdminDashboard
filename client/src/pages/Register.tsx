import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      username: "",
      password: "",
      email: "",
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <img 
              src={logoPath} 
              alt="Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Kayıt Ol
          </CardTitle>
          <CardDescription className="text-center">
            Yeni hesap oluşturun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                {...registerForm.register("username")}
                placeholder="Kullanıcı adınızı giriniz"
              />
              {registerForm.formState.errors.username && (
                <p className="text-sm text-red-500">{registerForm.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                {...registerForm.register("email")}
                placeholder="E-posta adresinizi giriniz"
              />
              {registerForm.formState.errors.email && (
                <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                {...registerForm.register("password")}
                placeholder="Şifrenizi giriniz"
              />
              {registerForm.formState.errors.password && (
                <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Hesap Türü</Label>
              <select 
                id="role"
                {...registerForm.register("role")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="individual">Bireysel Kullanıcı</option>
                <option value="corporate">Kurumsal Kullanıcı</option>
              </select>
              {registerForm.formState.errors.role && (
                <p className="text-sm text-red-500">{registerForm.formState.errors.role.message}</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={registerLoading}
            >
              {registerLoading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/login">
              <Button variant="ghost" className="text-sm">
                Hesabınız var mı? Giriş yapın
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}