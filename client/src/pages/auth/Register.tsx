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
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import logoPath from "@assets/logo_1752808818099.png";
import { Box, FormControl, InputLabel, MenuItem, Select, TextField, IconButton, InputAdornment, OutlinedInput, Button as MuiButton, Grid } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          
          <CardTitle className="text-2xl font-bold text-center">
            Kayıt Ol
          </CardTitle>
          
        </CardHeader>
        <CardContent>
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            <div className="space-y-2">
              <Box sx={{ minWidth: 120 }}>
                <FormControl fullWidth>
                  <InputLabel id="role-select-label">Hesap Türü</InputLabel>
                  <Select
                    labelId="role-select-label"
                    id="role-select"
                    value={registerForm.watch("role")}
                    label="Hesap Türü"
                    native
                    {...registerForm.register("role")}
                  >
                    <option value="individual">Bireysel</option>
                    <option value="corporate">Kurumsal</option>
                  </Select>
                </FormControl>
              </Box>
              {registerForm.formState.errors.role && (
                <p className="text-sm text-red-500">{registerForm.formState.errors.role.message}</p>
              )}
            </div>
            
            {registerForm.watch("role") === "corporate" && (
              <div className="space-y-2">
                <TextField
                  id="companyName"
                  label="Firma Adı"
                  variant="outlined"
                  fullWidth
                  {...registerForm.register("companyName")}
                  placeholder="Firma adınızı giriniz"
                  error={!!registerForm.formState.errors.companyName}
                  helperText={registerForm.formState.errors.companyName?.message}
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
            )}
            
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  id="firstName"
                  label="Ad"
                  variant="outlined"
                  fullWidth
                  {...registerForm.register("firstName")}
                  placeholder="Adınızı giriniz"
                  error={!!registerForm.formState.errors.firstName}
                  helperText={registerForm.formState.errors.firstName?.message}
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
              </Grid>
              <Grid size={6}>
                <TextField
                  id="lastName"
                  label="Soyad"
                  variant="outlined"
                  fullWidth
                  {...registerForm.register("lastName")}
                  placeholder="Soyadınızı giriniz"
                  error={!!registerForm.formState.errors.lastName}
                  helperText={registerForm.formState.errors.lastName?.message}
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
              </Grid>
            </Grid>
            
            <div className="space-y-2">
              <TextField
                id="email"
                label="E-posta"
                variant="outlined"
                type="email"
                fullWidth
                {...registerForm.register("email")}
                placeholder="E-posta adresinizi giriniz"
                error={!!registerForm.formState.errors.email}
                helperText={registerForm.formState.errors.email?.message}
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
                  {...registerForm.register("password")}
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
                  error={!!registerForm.formState.errors.password}
                  sx={{
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#EC7830',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#EC7830',
                    },
                  }}
                />
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">{registerForm.formState.errors.password.message}</p>
                )}
              </FormControl>
            </div>
            <MuiButton 
              type="submit" 
              variant="contained"
              fullWidth
              disabled={registerLoading}
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
              {registerLoading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
            </MuiButton>
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