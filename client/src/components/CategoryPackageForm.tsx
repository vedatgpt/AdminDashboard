import { useState, useEffect } from "react";
import { useCreateCategoryPackage, useUpdateCategoryPackage } from "@/hooks/useCategoryPackages";
import type { CategoryPackage, InsertCategoryPackage } from "@shared/schema";

interface CategoryPackageFormProps {
  categoryId: number;
  package?: CategoryPackage;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CategoryPackageForm({ 
  categoryId, 
  package: editPackage, 
  isOpen, 
  onClose, 
  onSuccess 
}: CategoryPackageFormProps) {
  const [formData, setFormData] = useState<InsertCategoryPackage>({
    categoryId,
    name: "",
    description: "",
    price: 0,
    durationDays: 30,
    features: "",
    membershipTypes: "",
    isActive: true,
    sortOrder: 0,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateCategoryPackage();
  const updateMutation = useUpdateCategoryPackage();

  // Reset form when modal opens/closes or package changes
  useEffect(() => {
    if (isOpen) {
      if (editPackage) {
        setFormData({
          categoryId,
          name: editPackage.name,
          description: editPackage.description || "",
          price: editPackage.price,
          durationDays: editPackage.durationDays,
          features: editPackage.features || "",
          membershipTypes: editPackage.membershipTypes || "",
          isActive: editPackage.isActive,
          sortOrder: editPackage.sortOrder,
        });
      } else {
        setFormData({
          categoryId,
          name: "",
          description: "",
          price: 0,
          durationDays: 30,
          features: "",
          membershipTypes: "",
          isActive: true,
          sortOrder: 0,
        });
      }
      setValidationErrors({});
    }
  }, [isOpen, editPackage, categoryId]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Paket adı gereklidir";
    }

    if ((formData.price || 0) < 0) {
      errors.price = "Fiyat negatif olamaz";
    }

    if ((formData.durationDays || 0) < 1) {
      errors.durationDays = "Süre en az 1 gün olmalıdır";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editPackage) {
        await updateMutation.mutateAsync({
          id: editPackage.id,
          name: formData.name,
          description: formData.description,
          price: formData.price || 0,
          durationDays: formData.durationDays || 30,
          features: formData.features,
          membershipTypes: formData.membershipTypes,
          isActive: formData.isActive,
          sortOrder: formData.sortOrder,
        });
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          description: formData.description,
          price: formData.price || 0,
          durationDays: formData.durationDays || 30,
          features: formData.features,
          membershipTypes: formData.membershipTypes,
          isActive: formData.isActive,
          sortOrder: formData.sortOrder,
          categoryId,
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Form submission error:", error);
      setValidationErrors({ 
        general: error.message || "Bir hata oluştu" 
      });
    }
  };

  const handleInputChange = (field: keyof InsertCategoryPackage, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const formatPriceForDisplay = (priceInCents: number): string => {
    return (priceInCents / 100).toFixed(2);
  };

  const parsePriceFromDisplay = (displayPrice: string): number => {
    const parsed = parseFloat(displayPrice) || 0;
    return Math.round(parsed * 100);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const priceInCents = parsePriceFromDisplay(e.target.value);
    handleInputChange("price", priceInCents);
  };

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-25" 
          onClick={onClose}
        ></div>
        
        <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {editPackage ? "Paketi Düzenle" : "Yeni Paket Ekle"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {validationErrors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{validationErrors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Paket Adı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paket Adı *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.name ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Örn: Premium Vitrin"
                disabled={isLoading}
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            {/* Açıklama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Paket özelliklerini açıklayın..."
                disabled={isLoading}
              />
            </div>

            {/* Fiyat ve Süre */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fiyat (TL) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formatPriceForDisplay(formData.price || 0)}
                  onChange={handlePriceChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.price ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                  disabled={isLoading}
                />
                {validationErrors.price && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Süre (Gün) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.durationDays || 30}
                  onChange={(e) => handleInputChange("durationDays", parseInt(e.target.value) || 1)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.durationDays ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="30"
                  disabled={isLoading}
                />
                {validationErrors.durationDays && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.durationDays}</p>
                )}
              </div>
            </div>

            {/* Özellikler */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Özellikler (JSON)
              </label>
              <textarea
                value={formData.features || ""}
                onChange={(e) => handleInputChange("features", e.target.value)}
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder='["top_listing", "highlighted", "badge"]'
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                JSON formatında özellik listesi (örn: ["top_listing", "highlighted"])
              </p>
            </div>

            {/* Üyelik Türleri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Üyelik Türleri (JSON)
              </label>
              <textarea
                value={formData.membershipTypes || ""}
                onChange={(e) => handleInputChange("membershipTypes", e.target.value)}
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder='["individual", "corporate"]'
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                JSON formatında üyelik türleri (örn: ["individual"] veya ["corporate"] veya ["individual", "corporate"])
              </p>
            </div>

            {/* Aktif Durumu */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange("isActive", e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isLoading}
              />
              <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                Aktif
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-[#EC7830] border border-transparent rounded-md hover:bg-[#D6691A] disabled:opacity-50"
              >
                {isLoading ? "Kaydediliyor..." : editPackage ? "Güncelle" : "Oluştur"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}