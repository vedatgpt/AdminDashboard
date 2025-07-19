import { Button } from '@mui/material';

interface AuthButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export function AuthButton({ children, loading, type = 'button', disabled }: AuthButtonProps) {
  return (
    <Button 
      type={type}
      variant="contained"
      fullWidth
      disabled={disabled || loading}
      sx={{
        backgroundColor: '#EC7830',
        '&:hover': { backgroundColor: '#d9661a', boxShadow: 'none' },
        '&:disabled': { backgroundColor: '#f3f4f6' },
        py: 1.5,
        fontSize: '1rem',
        fontWeight: 600,
        textTransform: 'none',
        boxShadow: 'none',
      }}
    >
      {children}
    </Button>
  );
}