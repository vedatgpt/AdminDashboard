import { useState, forwardRef } from 'react';
import { FormControl, InputLabel, OutlinedInput, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface PasswordFieldProps {
  label: string;
  placeholder: string;
  error?: boolean;
  helperText?: string;
  [key: string]: any;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, placeholder, error, helperText, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div>
        <FormControl fullWidth variant="outlined">
          <InputLabel htmlFor="password-input">{label}</InputLabel>
          <OutlinedInput
            id="password-input"
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            placeholder={placeholder}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? 'hide password' : 'show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
            label={label}
            error={error}
            sx={{
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#EC7830' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#EC7830' },
            }}
            {...props}
          />
          {error && helperText && (
            <p className="text-sm text-red-500 mt-1">{helperText}</p>
          )}
        </FormControl>
      </div>
    );
  }
);

PasswordField.displayName = 'PasswordField';