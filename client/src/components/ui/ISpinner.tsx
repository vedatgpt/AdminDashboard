import React from 'react';
import 'ispinner.css/ispinner.css';

interface ISpinnerProps {
  size?: number;
  color?: string;
  className?: string;
  overlay?: boolean;
  children?: React.ReactNode;
  loading?: boolean;
}

export default function ISpinner({ 
  size = 20, 
  color = '#EC7830', // Orange theme color
  className = '', 
  overlay = false,
  children,
  loading = true,
  ...props 
}: ISpinnerProps) {
  // If loading is false and children exist, show children
  if (!loading && children) {
    return <>{children}</>;
  }

  // If loading is false and no children, show nothing
  if (!loading) {
    return null;
  }

  const spinnerElement = (
    <div 
      className={`ispinner ${className}`}
      style={{
        width: size,
        height: size,
        '--ispinner-color': color,
      } as React.CSSProperties}
      {...props}
    >
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="ispinner-blade" />
      ))}
    </div>
  );

  // Overlay mode for full-screen loading
  if (overlay) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
        {spinnerElement}
      </div>
    );
  }

  // Inline mode
  return (
    <div className="flex items-center justify-center">
      {spinnerElement}
    </div>
  );
}

// Export additional variants for common use cases
export function LoadingSpinner({ size = 30, ...props }: Omit<ISpinnerProps, 'loading'>) {
  return <ISpinner size={size} loading={true} {...props} />;
}

export function ButtonSpinner({ size = 16, color = 'white', ...props }: Omit<ISpinnerProps, 'loading'>) {
  return <ISpinner size={size} color={color} loading={true} {...props} />;
}

export function PageSpinner({ size = 40, overlay = true, ...props }: Omit<ISpinnerProps, 'loading'>) {
  return <ISpinner size={size} overlay={overlay} loading={true} {...props} />;
}