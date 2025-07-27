import { useState, useEffect } from "react";
import { X, Package, DollarSign, Calendar, List, ToggleLeft, ToggleRight } from "lucide-react";
import type { DopingPackage, InsertDopingPackage, UpdateDopingPackage } from "@shared/schema";

interface DopingPackageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InsertDopingPackage | UpdateDopingPackage) => void;
  dopingPackage?: DopingPackage | null;
  isLoading?: boolean;
}

export default function DopingPackageForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  dopingPackage, 
  isLoading = false 
}: DopingPackageFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    durationDays: 30,
    features: "[]",
    isActive: true,
    sortOrder: 0,
  });

  const [featuresArray, setFeaturesArray] = useState<string[]>([]);

  // Reset form when modal opens/closes or dopingPackage changes
  useEffect(() => {
    if (isOpen) {
      if (dopingPackage) {
        setFormData({
          name: dopingPackage.name || "",
          description: dopingPackage.description || "",
          price: dopingPackage.price || 0,
          durationDays: dopingPackage.durationDays || 30,
          features: dopingPackage.features || "[]",
          isActive: dopingPackage.isActive ?? true,
          sortOrder: dopingPackage.sortOrder || 0,
        });
        
        try {
          const parsedFeatures = JSON.parse(dopingPackage.features || "[]");
          setFeaturesArray(Array.isArray(parsedFeatures) ? parsedFeatures : []);
        } catch {
          setFeaturesArray([]);
        }
      } else {
        setFormData({
          name: "",
          description: "",
          price: 0,
          durationDays: 30,
          features: "[]",
          isActive: true,
          sortOrder: 0,
        });
        setFeaturesArray([]);
      }
    }
  }, [isOpen, dopingPackage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      features: JSON.stringify(featuresArray),
    };
    
    onSubmit(submitData);
  };

  const addFeature = () => {
    setFeaturesArray([...featuresArray, ""]);
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...featuresArray];
    newFeatures[index] = value;
    setFeaturesArray(newFeatures);
  };

  const removeFeature = (index: number) => {
    setFeaturesArray(featuresArray.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {dopingPackage ? "Doping Paketi Düzenle" : "Yeni Doping Paketi"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Package Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4 inline mr-2" />
              Paket Adı *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Örn: Vitrin İlanı, Öne Çıkan İlan"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Paket hakkında açıklama"
            />
          </div>

          {/* Price and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Fiyat (Kuruş) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="5000 (50.00 TL)"
              />
              <p className="text-xs text-gray-500 mt-1">
                {(formData.price / 100).toFixed(2)} TL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Süre (Gün) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="30"
              />
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <List className="w-4 h-4 inline mr-2" />
              Özellikler
            </label>
            <div className="space-y-2">
              {featuresArray.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Örn: top_listing, highlighted, badge"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                + Özellik Ekle
              </button>
            </div>
          </div>

          {/* Status and Sort Order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durum
              </label>
              <div 
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className="flex items-center gap-3 cursor-pointer"
              >
                {formData.isActive ? (
                  <ToggleRight className="w-8 h-8 text-green-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
                <span className={`text-sm font-medium ${formData.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                  {formData.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sıralama
              </label>
              <input
                type="number"
                min="0"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Kaydediliyor..." : (dopingPackage ? "Güncelle" : "Oluştur")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}