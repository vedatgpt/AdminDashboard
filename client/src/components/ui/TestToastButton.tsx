import React from 'react';
import { useToast } from '@/contexts/ToastContext';

const TestToastButton: React.FC = () => {
  const { showToast } = useToast();

  const testToasts = () => {
    showToast('success', 'İşlem başarıyla tamamlandı!', 3000);
    
    setTimeout(() => {
      showToast('error', 'Bir hata oluştu! Lütfen tekrar deneyin.', 5000);
    }, 1000);
    
    setTimeout(() => {
      showToast('warning', 'Dikkat: Bu işlem geri alınamaz!', 4000);
    }, 2000);
    
    setTimeout(() => {
      showToast('info', 'Yeni özellikler yakında eklenecek.', 6000);
    }, 3000);
  };

  return (
    <button
      onClick={testToasts}
      className="px-4 py-2 bg-[#EC7830] text-white rounded-lg hover:bg-orange-600 transition-colors"
    >
      Toast Test Et
    </button>
  );
};

export default TestToastButton;