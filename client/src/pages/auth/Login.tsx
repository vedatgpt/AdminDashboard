import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import logoPath from "@assets/logo_1752808818099.png";
import { TextField, FormControl, InputLabel, OutlinedInput, InputAdornment, IconButton, Button as MuiButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          
          <CardTitle className="text-2xl font-bold text-center">
            Giriş Yap
          </CardTitle>
         
        </CardHeader>
        <CardContent>
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-2">
              <TextField
                id="emailOrUsername"
                label="E-posta veya Kullanıcı Adı"
                variant="outlined"
                fullWidth
                {...loginForm.register("emailOrUsername")}
                placeholder="E-posta adresinizi veya kullanıcı adınızı giriniz"
                error={!!loginForm.formState.errors.emailOrUsername}
                helperText={loginForm.formState.errors.emailOrUsername?.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#EC7830',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#EC7830',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#EC7830',
                  },
                }}
              />
            </div>
            
            <div className="space-y-2">
              <FormControl fullWidth variant="outlined">
                <InputLabel htmlFor="outlined-adornment-password">Şifre</InputLabel>
                <OutlinedInput
                  id="outlined-adornment-password"
                  type={showPassword ? 'text' : 'password'}
                  {...loginForm.register("password")}
                  placeholder="Şifrenizi giriniz"
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'hide the password' : 'display the password'}
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Şifre"
                  error={!!loginForm.formState.errors.password}
                  sx={{
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#EC7830',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#EC7830',
                    },
                  }}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">{loginForm.formState.errors.password.message}</p>
                )}
              </FormControl>
            </div>
            
            <MuiButton 
              type="submit" 
              variant="contained"
              fullWidth
              disabled={loginLoading}
              sx={{
                backgroundColor: '#EC7830',
                '&:hover': {
                  backgroundColor: '#d9661a',
                },
                '&:disabled': {
                  backgroundColor: '#f3f4f6',
                },
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              {loginLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </MuiButton>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/register">
              <Button variant="ghost" className="text-sm">
                Hesabınız yok mu? Kayıt olun
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}