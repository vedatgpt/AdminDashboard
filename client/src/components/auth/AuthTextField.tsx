import { TextField } from '@mui/material';
import { forwardRef } from 'react';

const brandSx = {
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': { borderColor: '#EC7830' },
    '&.Mui-focused fieldset': { borderColor: '#EC7830' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#EC7830' },
};

export const AuthTextField = forwardRef<HTMLInputElement, any>((props, ref) => (
  <TextField
    ref={ref}
    variant="outlined"
    fullWidth
    sx={brandSx}
    {...props}
  />
));

AuthTextField.displayName = 'AuthTextField';