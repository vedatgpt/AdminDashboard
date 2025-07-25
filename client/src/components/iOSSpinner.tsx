interface iOSSpinnerProps {
  size?: 'small' | 'large';
  variant?: 'default' | 'orange' | 'white';
  className?: string;
}

export function iOSSpinner({ 
  size = 'large', 
  variant = 'default', 
  className = '' 
}: iOSSpinnerProps) {
  const sizeClass = size === 'large' ? 'ispinner-large' : '';
  const variantClass = variant === 'orange' ? 'ispinner-orange' : variant === 'white' ? 'ispinner-white' : '';
  
  return (
    <div className={`ispinner ${sizeClass} ${variantClass} ${className}`}>
      <div className="ispinner-blade"></div>
      <div className="ispinner-blade"></div>
      <div className="ispinner-blade"></div>
      <div className="ispinner-blade"></div>
      <div className="ispinner-blade"></div>
      <div className="ispinner-blade"></div>
      <div className="ispinner-blade"></div>
      <div className="ispinner-blade"></div>
    </div>
  );
}