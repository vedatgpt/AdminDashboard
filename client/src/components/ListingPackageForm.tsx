import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { ListingPackage, InsertListingPackage, UpdateListingPackage } from "@shared/schema";

interface ListingPackageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InsertListingPackage | UpdateListingPackage) => void;
  listingPackage?: ListingPackage | null;
  isLoading?: boolean;
}

export default function ListingPackageForm({ isOpen, onClose, onSubmit, listingPackage, isLoading }: ListingPackageFormProps) {
  const [formData, setFormData] = useState<InsertListingPackage>({
    name: "",
    description: "",
    basePrice: 0,
    durationDays: 30,
    features: "",
    maxPhotos: 20,
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    if (listingPackage) {
      setFormData({
        name: listingPackage.name,
        description: listingPackage.description || "",
        basePrice: listingPackage.basePrice,
        durationDays: listingPackage.durationDays,
        features: listingPackage.features || "",
        maxPhotos: listingPackage.maxPhotos,
        isActive: listingPackage.isActive,
        sortOrder: listingPackage.sortOrder,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        basePrice: 0,
        durationDays: 30,
        features: "",
        maxPhotos: 20,
        isActive: true,
        sortOrder: 0,
      });
    }
  }, [listingPackage, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFeatureInputChange = (value: string) => {
    setFormData({ ...formData, features: value });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {listingPackage ? "İlan Paketi Düzenle" : "Yeni İlan Paketi"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Package Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paket Adı *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
              placeholder="Ücretsiz İlan, Premium İlan, Vitrin İlan"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
              placeholder="Paket açıklaması..."
            />
          </div>

          {/* Base Price and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temel Fiyat (TL) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={Math.floor((formData.basePrice || 0) / 100)}
                onChange={(e) => setFormData({ ...formData, basePrice: parseInt(e.target.value) * 100 || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Süre (Gün) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                placeholder="30"
              />
            </div>
          </div>

          {/* Max Photos and Sort Order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maksimum Fotoğraf Sayısı *
              </label>
              <input
                type="number"
                required
                min="1"
                max="50"
                value={formData.maxPhotos}
                onChange={(e) => setFormData({ ...formData, maxPhotos: parseInt(e.target.value) || 20 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                placeholder="20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sıralama Numarası
              </label>
              <input
                type="number"
                min="0"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Özellikler (JSON formatında)
            </label>
            <textarea
              value={formData.features || ""}
              onChange={(e) => handleFeatureInputChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EC7830] focus:border-transparent font-mono text-sm"
              placeholder='["top_listing", "highlighted", "badge_premium", "refresh_daily"]'
            />
            <p className="text-xs text-gray-500 mt-1">
              Özellikler JSON array formatında girilmelidir. Örnek: ["top_listing", "highlighted"]
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-[#EC7830] bg-gray-100 border-gray-300 rounded focus:ring-[#EC7830] focus:ring-2"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Aktif
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-[#EC7830] focus:border-transparent transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#EC7830] border border-transparent rounded-lg hover:bg-[#d96b2a] focus:ring-2 focus:ring-[#EC7830] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Kaydediliyor..." : (listingPackage ? "Güncelle" : "Oluştur")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}