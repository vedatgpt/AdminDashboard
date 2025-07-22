import { useState, useEffect } from "react";
import { ArrowLeft, Save, AlertTriangle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { LocationSettings, UpdateLocationSettings } from "@shared/schema";

export default function LocationSettings() {
  const [location, setLocation] = useLocation();
  const [settings, setSettings] = useState<LocationSettings>({
    id: 1,
    showCountry: true,
    showCity: true,
    showDistrict: true,
    showNeighborhood: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const [showAlert, setShowAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: locationSettings, isLoading } = useQuery({
    queryKey: ['/api/location-settings'],
    queryFn: () => apiRequest('/api/location-settings') as Promise<LocationSettings>,
  });

  // Update local state when data is loaded
  useEffect(() => {
    if (locationSettings) {
      setSettings(locationSettings);
    }
  }, [locationSettings]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (updates: UpdateLocationSettings) =>
      apiRequest('/api/location-settings', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/location-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/location-settings/public'] });
      setShowAlert({ type: 'success', message: 'Lokasyon görünürlük ayarları başarıyla güncellendi!' });
      setTimeout(() => setShowAlert(null), 3000);
    },
    onError: (error: any) => {
      console.error('Location settings update error:', error);
      const errorMessage = error?.message || 'Ayarlar güncellenirken hata oluştu. Lütfen tekrar deneyin.';
      setShowAlert({ type: 'error', message: errorMessage });
      setTimeout(() => setShowAlert(null), 3000);
    },
  });

  const handleSave = () => {
    console.log('Saving location settings:', {
      showCountry: settings.showCountry,
      showCity: settings.showCity,
      showDistrict: settings.showDistrict,
      showNeighborhood: settings.showNeighborhood,
    });
    
    updateMutation.mutate({
      showCountry: settings.showCountry,
      showCity: settings.showCity,
      showDistrict: settings.showDistrict,
      showNeighborhood: settings.showNeighborhood,
    });
  };

  const handleToggle = (field: keyof Pick<LocationSettings, 'showCountry' | 'showCity' | 'showDistrict' | 'showNeighborhood'>) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Ayarlar yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Alert */}
      {showAlert && (
        <div className={`rounded-md p-4 ${
          showAlert.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {showAlert.type === 'success' ? 
                <CheckCircle className="h-5 w-5 text-green-400" /> : 
                <AlertTriangle className="h-5 w-5 text-red-400" />
              }
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                showAlert.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {showAlert.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Back Button */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <button
              onClick={() => setLocation('/admin/locations')}
              className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </button>
            <h3 className="text-lg font-medium text-gray-900">Lokasyon Görünürlük Ayarları</h3>
          </div>

          <div className="space-y-4">
            {/* Country Setting */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <label className="text-sm font-medium text-gray-900">Ülke Seçimi</label>
                <p className="text-sm text-gray-500">Kullanıcılar ülke seçebilsin</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showCountry}
                  onChange={() => handleToggle('showCountry')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            {/* City Setting */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <label className="text-sm font-medium text-gray-900">Şehir/İl Seçimi</label>
                <p className="text-sm text-gray-500">Kullanıcılar şehir/il seçebilsin</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showCity}
                  onChange={() => handleToggle('showCity')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            {/* District Setting */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <label className="text-sm font-medium text-gray-900">İlçe Seçimi</label>
                <p className="text-sm text-gray-500">Kullanıcılar ilçe seçebilsin</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showDistrict}
                  onChange={() => handleToggle('showDistrict')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            {/* Neighborhood Setting */}
            <div className="flex items-center justify-between py-3">
              <div>
                <label className="text-sm font-medium text-gray-900">Mahalle Seçimi</label>
                <p className="text-sm text-gray-500">Kullanıcılar mahalle seçebilsin</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showNeighborhood}
                  onChange={() => handleToggle('showNeighborhood')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>
          </div>

          

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white text-sm font-medium rounded-md transition-colors"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}