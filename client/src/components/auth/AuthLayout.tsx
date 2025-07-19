import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { Link } from 'wouter';
import logoPath from "@assets/logo_1752808818099.png";

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
  linkText: string;
  linkHref: string;
}

export function AuthLayout({ title, children, linkText, linkHref }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card sx={{ width: '100%', maxWidth: 448, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
        <CardHeader sx={{ textAlign: 'center', pb: 1 }}>
          <div className="flex justify-center mb-4">
            <img src={logoPath} alt="Logo" className="h-12 w-auto" />
          </div>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
            {title}
          </Typography>
        </CardHeader>
        <CardContent>
          {children}
          <div className="mt-6 text-center">
            <Link href={linkHref}>
              <Typography 
                component="button"
                sx={{ 
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  '&:hover': { color: '#EC7830' },
                }}
              >
                {linkText}
              </Typography>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}