import { useState, useEffect } from "react";
import { useCategoryPackages } from "@/hooks/useCategoryPackages";
import type { CategoryPackage } from "@shared/schema";

interface CategoryPackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: { id: number; name: string } | null;
}

export default function CategoryPackagesModal({ isOpen, onClose, category }: CategoryPackagesModalProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CategoryPackage | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    durationDays: 30,
    features: [] as string[],
    membershipTypes: ["individual", "corporate"] as string[],
    isActive: true,
  });
  
  const [newFeature, setNewFeature] = useState("");

  const {
    packages,
    isLoading,
    createPackage,
    updatePackage,
    deletePackage,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCategoryPackages(category?.id || 0, {
    onCreateSuccess: () => {
      resetForm();
    },
    onUpdateSuccess: () => {
      resetForm();
    }
  });

  useEffect(() => {
    if (editingPackage) {
      setFormData({
        name: editingPackage.name,
        description: editingPackage.description || "",
        price: editingPackage.price,
        durationDays: editingPackage.durationDays,
        features: parseFeatures(editingPackage.features),
        membershipTypes: parseMembershipTypes(editingPackage.membershipTypes),
        isActive: editingPackage.isActive,
      });
      setShowForm(true);
    }
  }, [editingPackage]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      durationDays: 30,
      features: [],
      membershipTypes: ["individual", "corporate"],
      isActive: true,
    });
    setNewFeature("");
    setEditingPackage(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert("Paket adı gereklidir");
      return;
    }

    const submitData = {
      ...formData,
      features: JSON.stringify(formData.features),
      membershipTypes: JSON.stringify(formData.membershipTypes)
    };

    if (editingPackage) {
      updatePackage({ id: editingPackage.id, ...submitData });
    } else {
      createPackage(submitData);
    }
  };

  const handleDelete = (packageToDelete: CategoryPackage) => {
    if (confirm(`"${packageToDelete.name}" paketini silmek istediğinizden emin misiniz?`)) {
      deletePackage(packageToDelete.id);
    }
  };

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => ({ ...prev, price: Math.round(value * 100) }));
  };

  const parseMembershipTypes = (membershipTypes: string): string[] => {
    try {
      return JSON.parse(membershipTypes);
    } catch {
      return ["individual", "corporate"];
    }
  };

  const parseFeatures = (features: string): string[] => {
    try {
      return JSON.parse(features);
    } catch {
      return [];
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {category?.name} - Kategori Paketleri
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC7830]"></div>
              <p className="mt-2 text-gray-600">Paketler yükleniyor...</p>
            </div>
          ) : (
            <>
              {/* Package List */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Mevcut Paketler</h3>
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-[#EC7830] hover:bg-[#d96b2a] text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {showForm ? "İptal Et" : "Yeni Paket Ekle"}
                  </button>
                </div>

                {packages.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Bu kategori için henüz paket tanımlanmamış.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(packages as CategoryPackage[]).map((pkg: CategoryPackage) => (
                      <div
                        key={pkg.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-900">{pkg.name}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                pkg.isActive 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {pkg.isActive ? "Aktif" : "Pasif"}
                              </span>
                            </div>
                            
                            {pkg.description && (
                              <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="font-medium text-[#EC7830]">{formatPrice(pkg.price)} TL</span>
                              <span>{pkg.durationDays} gün</span>
                              <span>
                                {parseMembershipTypes(pkg.membershipTypes).map(type => 
                                  type === "individual" ? "Bireysel" : "Kurumsal"
                                ).join(", ")}
                              </span>
                            </div>

                            {parseFeatures(pkg.features).length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-500">Özellikler: </span>
                                <span className="text-xs text-gray-700">
                                  {parseFeatures(pkg.features).join(", ")}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => setEditingPackage(pkg)}
                              className="text-[#EC7830] hover:text-[#d96b2a] text-sm font-medium"
                              disabled={isUpdating}
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => handleDelete(pkg)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                              disabled={isDeleting}
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form */}
              {showForm && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingPackage ? "Paketi Düzenle" : "Yeni Paket Ekle"}
                  </h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Package Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Paket Adı *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                          placeholder="Örn: Premium Paket"
                          required
                        />
                      </div>

                      {/* Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fiyat (TL) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formatPrice(formData.price)}
                          onChange={handlePriceChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                          placeholder="0.00"
                          required
                        />
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Süre (Gün) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.durationDays}
                          onChange={(e) => setFormData(prev => ({ ...prev, durationDays: parseInt(e.target.value) || 30 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                          required
                        />
                      </div>

                      {/* Active Status */}
                      <div className="flex items-center">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Durum
                        </label>
                        <div className="ml-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.isActive}
                              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                              className="rounded border-gray-300 text-[#EC7830] focus:ring-[#EC7830]"
                            />
                            <span className="ml-2 text-sm text-gray-700">Aktif</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Açıklama
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                        placeholder="Paket hakkında açıklama..."
                      />
                    </div>

                    {/* Membership Types */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Üyelik Türleri
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.membershipTypes.includes("individual")}
                            onChange={(e) => {
                              const updated = e.target.checked 
                                ? [...formData.membershipTypes.filter(t => t !== "individual"), "individual"]
                                : formData.membershipTypes.filter(t => t !== "individual");
                              setFormData(prev => ({ ...prev, membershipTypes: updated }));
                            }}
                            className="rounded border-gray-300 text-[#EC7830] focus:ring-[#EC7830]"
                          />
                          <span className="ml-2 text-sm text-gray-700">Bireysel</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.membershipTypes.includes("corporate")}
                            onChange={(e) => {
                              const updated = e.target.checked 
                                ? [...formData.membershipTypes.filter(t => t !== "corporate"), "corporate"]
                                : formData.membershipTypes.filter(t => t !== "corporate");
                              setFormData(prev => ({ ...prev, membershipTypes: updated }));
                            }}
                            className="rounded border-gray-300 text-[#EC7830] focus:ring-[#EC7830]"
                          />
                          <span className="ml-2 text-sm text-gray-700">Kurumsal</span>
                        </label>
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paket Özellikleri
                      </label>
                      
                      {/* Add new feature */}
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          placeholder="Yeni özellik ekle..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
                              setFormData(prev => ({ 
                                ...prev, 
                                features: [...prev.features, newFeature.trim()] 
                              }));
                              setNewFeature("");
                            }
                          }}
                          className="px-3 py-2 bg-[#EC7830] text-white rounded-md hover:bg-[#d96b2a] text-sm"
                        >
                          Ekle
                        </button>
                      </div>

                      {/* Feature list */}
                      <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                        {formData.features.length === 0 ? (
                          <p className="text-gray-500 text-sm text-center py-2">Henüz özellik eklenmedi</p>
                        ) : (
                          formData.features.map((feature, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                              <span className="text-sm text-gray-700">{feature}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    features: prev.features.filter((_, i) => i !== index)
                                  }));
                                }}
                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                              >
                                Sil
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        disabled={isCreating || isUpdating}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#EC7830] border border-transparent rounded-md hover:bg-[#d96b2a] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreating || isUpdating ? "Kaydediliyor..." : (editingPackage ? "Güncelle" : "Ekle")}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}