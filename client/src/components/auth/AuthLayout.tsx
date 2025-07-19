import { ReactNode } from 'react';
import { Box, Stack, Typography, Link as MuiLink } from '@mui/material';
import { styled } from '@mui/material/styles';
import MuiCard from '@mui/material/Card';
import { Link } from 'wouter';
import logoPath from "@assets/logo_1752808818099.png";

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  maxWidth: '450px',
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
}));

const AuthContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
  },
}));

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
  linkText: string;
  linkHref: string;
}

export function AuthLayout({ title, children, linkText, linkHref }: AuthLayoutProps) {
  return (
    <AuthContainer direction="column" justifyContent="center">
      <Card variant="outlined">
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <img src={logoPath} alt="Logo" style={{ height: 48, width: 'auto' }} />
        </Box>
        <Typography
          component="h1"
          variant="h4"
          sx={{ 
            width: '100%', 
            fontSize: 'clamp(2rem, 10vw, 2.15rem)',
            textAlign: 'center',
            mb: 2
          }}
        >
          {title}
        </Typography>
        {children}
        <Typography sx={{ textAlign: 'center', mt: 2 }}>
          <Link href={linkHref}>
            <MuiLink 
              component="button"
              variant="body2" 
              sx={{ 
                alignSelf: 'center',
                color: '#EC7830',
                textDecoration: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {linkText}
            </MuiLink>
          </Link>
        </Typography>
      </Card>
    </AuthContainer>
  );
}