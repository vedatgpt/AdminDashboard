import { FormControl, FormLabel, TextField } from '@mui/material';
import { forwardRef } from 'react';

interface AuthTextFieldProps {
  label: string;
  error?: boolean;
  helperText?: string;
  [key: string]: any;
}

export const AuthTextField = forwardRef<HTMLInputElement, AuthTextFieldProps>(
  ({ label, error, helperText, ...props }, ref) => (
    <FormControl fullWidth>
      <FormLabel htmlFor={props.id || props.name}>{label}</FormLabel>
      <TextField
        ref={ref}
        variant="outlined"
        fullWidth
        error={error}
        helperText={helperText}
        color={error ? 'error' : 'primary'}
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
  )
);

AuthTextField.displayName = 'AuthTextField';