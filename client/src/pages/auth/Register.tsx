import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, type RegisterData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { FormControl, InputLabel, Select, Grid } from '@mui/material';
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { AuthButton } from "@/components/auth/AuthButton";
import { PasswordField } from "@/components/auth/PasswordField";

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { register, registerLoading, user, isAuthenticated } = useAuth();

  const form = useForm<RegisterData>({
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

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "admin" ? "/admin/users" : "/");
    }
  }, [isAuthenticated, user, navigate]);

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg">Yönlendiriliyor...</div>
      </div>
    );
  }

  const handleSubmit = async (data: RegisterData) => {
    try {
      await register(data);
      toast({ title: "Başarılı", description: "Kayıt başarılı" });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Kayıt başarısız",
        variant: "destructive",
      });
    }
  };

  const role = form.watch("role");

  return (
    <AuthLayout 
      title="Kayıt Ol"
      linkText="Hesabınız var mı? Giriş yapın"
      linkHref="/login"
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormControl fullWidth>
          <InputLabel>Hesap Türü</InputLabel>
          <Select
            value={role}
            label="Hesap Türü"
            native
            {...form.register("role")}
          >
            <option value="individual">Bireysel</option>
            <option value="corporate">Kurumsal</option>
          </Select>
        </FormControl>

        {role === "corporate" && (
          <AuthTextField
            label="Firma Adı"
            placeholder="Firma adınızı giriniz"
            error={!!form.formState.errors.companyName}
            helperText={form.formState.errors.companyName?.message}
            {...form.register("companyName")}
          />
        )}

        <Grid container spacing={2}>
          <Grid size={6}>
            <AuthTextField
              label="Ad"
              placeholder="Adınızı giriniz"
              error={!!form.formState.errors.firstName}
              helperText={form.formState.errors.firstName?.message}
              {...form.register("firstName")}
            />
          </Grid>
          <Grid size={6}>
            <AuthTextField
              label="Soyad"
              placeholder="Soyadınızı giriniz"
              error={!!form.formState.errors.lastName}
              helperText={form.formState.errors.lastName?.message}
              {...form.register("lastName")}
            />
          </Grid>
        </Grid>

        <AuthTextField
          label="E-posta"
          type="email"
          placeholder="E-posta adresinizi giriniz"
          error={!!form.formState.errors.email}
          helperText={form.formState.errors.email?.message}
          {...form.register("email")}
        />

        <PasswordField
          label="Şifre"
          placeholder="Şifrenizi giriniz"
          error={!!form.formState.errors.password}
          helperText={form.formState.errors.password?.message}
          {...form.register("password")}
        />

        <AuthButton type="submit" loading={registerLoading}>
          {registerLoading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}