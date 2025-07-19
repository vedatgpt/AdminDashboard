import { useState, forwardRef } from 'react';
import { FormControl, FormLabel, TextField, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface PasswordFieldProps {
  label: string;
  error?: boolean;
  helperText?: string;
  [key: string]: any;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, helperText, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <FormControl fullWidth>
        <FormLabel htmlFor={props.id || props.name}>{label}</FormLabel>
        <TextField
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          variant="outlined"
          fullWidth
          error={error}
          helperText={helperText}
          color={error ? 'error' : 'primary'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? 'hide password' : 'show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': { borderColor: '#EC7830' },
              '&.Mui-focused fieldset': { borderColor: '#EC7830' },
            },
            '& .MuiInputLabel-root.Mui-focused': { color: '#EC7830' },
          }}
          {...props}
        />
      </FormControl>
    );
  }
);

PasswordField.displayName = 'PasswordField';