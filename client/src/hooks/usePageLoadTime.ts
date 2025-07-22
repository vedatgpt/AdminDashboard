import { useState, useEffect } from 'react';

export function usePageLoadTime() {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [startTime] = useState(() => performance.now());

  useEffect(() => {
    // Calculate load time when component mounts and after a brief delay to ensure content is rendered
    const timer = setTimeout(() => {
      const endTime = performance.now();
      const totalTime = (endTime - startTime) / 1000; // Convert to seconds
      setLoadTime(totalTime);
    }, 100); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, [startTime]);

  const formatLoadTime = (time: number) => {
    return `${time.toFixed(3)} saniyede yüklendi`;
  };

  return {
    loadTime,
    loadTimeText: loadTime ? formatLoadTime(loadTime) : 'Yükleniyor...',
    isLoaded: loadTime !== null
  };
}