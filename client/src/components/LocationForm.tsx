import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Location, InsertLocation } from "@shared/schema";

interface LocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InsertLocation) => void;
  editingLocation?: Location | null;
  parentLocation?: Location | null;
  nextType?: string;
}

const getLocationTypeLabel = (type: string): string => {
  switch (type) {
    case "country": return "Ülke";
    case "city": return "Şehir";
    case "district": return "İlçe";
    case "neighborhood": return "Mahalle";
    default: return type;
  }
};

export default function LocationForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingLocation, 
  parentLocation,
  nextType 
}: LocationFormProps) {
  const [formData, setFormData] = useState<InsertLocation>({
    name: "",
    type: nextType || "country",
    parentId: parentLocation?.id || null,
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    if (editingLocation) {
      setFormData({
        name: editingLocation.name,
        type: editingLocation.type,
        parentId: editingLocation.parentId,
        sortOrder: editingLocation.sortOrder,
        isActive: editingLocation.isActive,
      });
    } else {
      setFormData({
        name: "",
        type: nextType || "country",
        parentId: parentLocation?.id || null,
        sortOrder: 0,
        isActive: true,
      });
    }
  }, [editingLocation, parentLocation, nextType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    onSubmit(formData);
    onClose();
    
    // Reset form
    setFormData({
      name: "",
      type: nextType || "country",
      parentId: parentLocation?.id || null,
      sortOrder: 0,
      isActive: true,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingLocation ? "Lokasyonu Düzenle" : `Yeni ${getLocationTypeLabel(formData.type)} Ekle`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getLocationTypeLabel(formData.type)} Adı
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={`${getLocationTypeLabel(formData.type)} adını giriniz`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>

          {parentLocation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Üst Lokasyon
              </label>
              <input
                type="text"
                value={`${parentLocation.name} (${getLocationTypeLabel(parentLocation.type)})`}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sıralama
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Aktif
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              {editingLocation ? "Güncelle" : "Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}