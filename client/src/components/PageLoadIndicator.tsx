import { usePageLoadTime } from '@/hooks/usePageLoadTime';

interface PageLoadIndicatorProps {
  className?: string;
}

export function PageLoadIndicator({ className = '' }: PageLoadIndicatorProps) {
  const { loadTimeText, isLoaded } = usePageLoadTime();

  if (!isLoaded) return null;

  return (
    <div className={`text-xs text-gray-500 text-center py-2 ${className}`}>
      ⚡ {loadTimeText}
    </div>
  );
}