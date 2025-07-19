import { Button, Typography, Box, Card, CardContent } from '@mui/material';

export default function MuiTestComponent() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Material UI Test Component
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        This component demonstrates that Material UI is properly installed and working.
      </Typography>
      <Card sx={{ maxWidth: 400, mb: 2 }}>
        <CardContent>
          <Typography variant="h6" component="h2">
            MUI Card Example
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This is a Material UI Card component to test the installation.
          </Typography>
        </CardContent>
      </Card>
      <Button variant="contained" color="primary" sx={{ mr: 1 }}>
        Primary Button
      </Button>
      <Button variant="outlined" color="secondary">
        Secondary Button
      </Button>
    </Box>
  );
}