interface IOSSpinnerProps {
  size?: 'small' | 'large';
  className?: string;
}

export function IOSSpinner({ 
  size = 'large', 
  className = '' 
}: IOSSpinnerProps) {
  const sizeClass = size === 'large' ? 'ispinner-large' : '';
  
  return (
    <div className={`ispinner ${sizeClass} ${className}`}>
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