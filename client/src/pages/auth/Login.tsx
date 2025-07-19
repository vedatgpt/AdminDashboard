import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AppProvider, SignInPage } from '@toolpad/core';
import { Button } from "@/components/ui/button";

// Custom theme with branding design tokens
const brandingDesignTokens = {
  palette: {
    primary: {
      main: '#EC7830',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f5f5f5',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
};

// Input customizations
const inputsCustomizations = {
  MuiTextField: {
    styleOverrides: {
      root: {
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
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
  },
};

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login, loginError, loginLoading, user, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") {
        navigate("/admin/users");
      } else if (user.userType === "personnel") {
        navigate("/dashboard/personnel");
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

  const calculatedMode = 'light'; // Always use light mode

  const THEME = createTheme({
    ...brandingDesignTokens,
    palette: {
      ...brandingDesignTokens.palette,
      mode: calculatedMode,
    },
    components: {
      ...inputsCustomizations,
    },
  });

  // Provider configuration for authentication methods
  const providers = [
    { id: 'credentials', name: 'E-posta veya Kullanıcı Adı' },
  ];

  // Sign in handler
  const signIn = async (provider: any, formData: FormData) => {
    const emailOrUsername = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await login({ emailOrUsername, password });
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
      throw error; // Let SignInPage handle the error display
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <ThemeProvider theme={THEME}>
        <AppProvider theme={THEME}>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md">
              <SignInPage
                signIn={signIn}
                providers={providers}
                slotProps={{
                  form: { noValidate: true },
                  submitButton: {
                    color: 'primary',
                    variant: 'contained',
                  },
                  emailField: {
                    label: 'E-posta veya Kullanıcı Adı',
                    placeholder: 'E-posta adresinizi veya kullanıcı adınızı giriniz'
                  },
                  passwordField: {
                    label: 'Şifre',
                    placeholder: 'Şifrenizi giriniz'
                  }
                }}
                sx={{
                  '& form > .MuiStack-root': {
                    marginTop: '2rem',
                    rowGap: '0.5rem',
                  },
                }}
              />
              
              <div className="mt-6 text-center">
                <Link href="/register">
                  <Button variant="ghost" className="text-sm">
                    Hesabınız yok mu? Kayıt olun
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </AppProvider>
      </ThemeProvider>
    </div>
  );
}