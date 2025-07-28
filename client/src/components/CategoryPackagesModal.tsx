import { useState, useEffect } from "react";
import { useCategoryPackages } from "../hooks/useCategoryPackages";

interface Category {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  slug: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  adCount: number;
  categoryType?: string;
}

interface CategoryPackagesModalProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryPackagesModal({ category, isOpen, onClose }: CategoryPackagesModalProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    durationDays: 30,
    features: [] as string[],
    membershipTypes: ["individual", "corporate"] as string[],
    isActive: true,
    applyToSubcategories: false,
    // Free listing configuration fields
    freeListingLimitIndividual: 0,
    freeListingLimitCorporate: 0,
    freeResetPeriodIndividual: "monthly" as "monthly" | "yearly" | "once",
    freeResetPeriodCorporate: "monthly" as "monthly" | "yearly" | "once",
    freeListingTitle: "Ücretsiz İlan",
    freeListingDescription: "Standart ilan özellikleri",
    freeListingPriceText: "0 TL",
  });
  
  const [newFeature, setNewFeature] = useState("");

  const {
    packages,
    isLoading,
    createPackage,
    updatePackage,
    deletePackage,
    reorderPackages,
    isCreating,
    isUpdating,
    isDeleting,
    isReordering,
  } = useCategoryPackages(category?.id || 0, {
    onCreateSuccess: () => {
      resetForm();
    },
    onUpdateSuccess: () => {
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      price: 0,
      durationDays: 30,
      features: [],
      membershipTypes: ["individual", "corporate"],
      isActive: true,
      applyToSubcategories: false,
      freeListingLimitIndividual: 0,
      freeListingLimitCorporate: 0,
      freeResetPeriodIndividual: "monthly",
      freeResetPeriodCorporate: "monthly",
      freeListingTitle: "Ücretsiz İlan",
      freeListingDescription: "Standart ilan özellikleri",
      freeListingPriceText: "0 TL",
    });
    setNewFeature("");
    setEditingPackage(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    const packageData = {
      categoryId: category.id,
      name: formData.name,
      price: formData.price,
      durationDays: formData.durationDays,
      features: JSON.stringify(formData.features),
      membershipTypes: JSON.stringify(formData.membershipTypes),
      isActive: formData.isActive,
      applyToSubcategories: formData.applyToSubcategories,
      // Free listing configuration
      freeListingLimitIndividual: formData.freeListingLimitIndividual,
      freeListingLimitCorporate: formData.freeListingLimitCorporate,
      freeResetPeriodIndividual: formData.freeResetPeriodIndividual,
      freeResetPeriodCorporate: formData.freeResetPeriodCorporate,
      freeListingTitle: formData.freeListingTitle,
      freeListingDescription: formData.freeListingDescription,
      freeListingPriceText: formData.freeListingPriceText,
    };

    if (editingPackage) {
      await updatePackage.mutateAsync({ id: editingPackage.id, ...packageData });
    } else {
      await createPackage.mutateAsync(packageData);
    }
  };

  const handleEdit = (pkg: any) => {
    setFormData({
      name: pkg.name,
      price: pkg.price,
      durationDays: pkg.durationDays || 30,
      features: parseFeatures(pkg.features),
      membershipTypes: parseMembershipTypes(pkg.membershipTypes),
      isActive: pkg.isActive,
      applyToSubcategories: pkg.applyToSubcategories || false,
      freeListingLimitIndividual: pkg.freeListingLimitIndividual || 0,
      freeListingLimitCorporate: pkg.freeListingLimitCorporate || 0,
      freeResetPeriodIndividual: pkg.freeResetPeriodIndividual || "monthly",
      freeResetPeriodCorporate: pkg.freeResetPeriodCorporate || "monthly",
      freeListingTitle: pkg.freeListingTitle || "Ücretsiz İlan",
      freeListingDescription: pkg.freeListingDescription || "Standart ilan özellikleri",
      freeListingPriceText: pkg.freeListingPriceText || "0 TL",
    });
    setEditingPackage(pkg);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bu paketi silmek istediğinizden emin misiniz?")) {
      await deletePackage.mutateAsync(id);
    }
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
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

  // Check if this category has inherited packages (has parent packages applying to subcategories)
  const hasInheritedPackages = packages && packages.some(pkg => pkg.categoryId !== category?.id);

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

        {/* Inheritance Warning */}
        {hasInheritedPackages && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <span className="text-amber-600 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-medium text-amber-800">Bu kategoride üst kategori paketleri geçerli</p>
                <p className="text-xs text-amber-700">Alt kategori olduğu için bazı paket ayarları üst kategoriden devralınıyor ve değiştirilemez.</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC7830]"></div>
              <p className="mt-2 text-gray-600">Yükleniyor...</p>
            </div>
          ) : (
            <div>
              {/* Package List - Only show when not in form mode */}
              {!showForm && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Mevcut Paketler</h3>
                    <button
                      onClick={() => setShowForm(true)}
                      className="bg-[#EC7830] hover:bg-[#d96b2a] text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Yeni Paket Ekle
                    </button>
                  </div>

                {packages && packages.length > 0 ? (
                  <div className="space-y-3">
                    {packages.map((pkg) => {
                      const isInherited = pkg.categoryId !== category?.id;
                      return (
                        <div key={pkg.id} className={`p-4 rounded-lg border ${isInherited ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                                {isInherited && (
                                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                                    Üst Kategoriden
                                  </span>
                                )}
                              </div>
                              <p className="text-2xl font-bold text-[#EC7830] mt-1">
                                {pkg.price === 0 ? "Ücretsiz" : `${pkg.price} TL`}
                              </p>
                              
                              {/* Free listing info */}
                              {(pkg.freeListingLimitIndividual > 0 || pkg.freeListingLimitCorporate > 0) && (
                                <div className="mt-2 text-sm text-green-600">
                                  Ücretsiz Hak: {pkg.freeListingLimitIndividual > 0 && `Bireysel ${pkg.freeListingLimitIndividual}`}
                                  {pkg.freeListingLimitIndividual > 0 && pkg.freeListingLimitCorporate > 0 && ", "}
                                  {pkg.freeListingLimitCorporate > 0 && `Kurumsal ${pkg.freeListingLimitCorporate}`}
                                </div>
                              )}
                              
                              <div className="mt-2">
                                <div className="flex flex-wrap gap-1">
                                  {parseFeatures(pkg.features).map((feature, index) => (
                                    <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                      {feature}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="mt-2 flex items-center gap-4">
                                <span className={`inline-block px-2 py-1 rounded text-xs ${
                                  pkg.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}>
                                  {pkg.isActive ? "Aktif" : "Pasif"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Kullanıcı Tipi: {parseMembershipTypes(pkg.membershipTypes).map(type => 
                                    type === "individual" ? "Bireysel" : "Kurumsal"
                                  ).join(", ")}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              {!isInherited ? (
                                <>
                                  <button
                                    onClick={() => handleEdit(pkg)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    Düzenle
                                  </button>
                                  <button
                                    onClick={() => handleDelete(pkg.id)}
                                    disabled={isDeleting}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                                  >
                                    Sil
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-amber-600 font-medium">
                                  Düzenlenemez
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Henüz paket eklenmemiş.</p>
                  </div>
                )}
                </div>
              )}

              {/* Package Form */}
              {showForm && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingPackage ? "Paket Düzenle" : "Yeni Paket Ekle"}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Package Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Paket Adı *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                          placeholder="Standart İlan"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fiyat (TL) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                          placeholder="99"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Süre (Gün) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={formData.durationDays}
                          onChange={(e) => setFormData(prev => ({ ...prev, durationDays: parseInt(e.target.value) || 30 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                          placeholder="30"
                        />
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Paket Özellikleri *
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          placeholder="Yeni özellik ekle"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                        />
                        <button
                          type="button"
                          onClick={addFeature}
                          className="px-4 py-2 bg-[#EC7830] text-white rounded-md hover:bg-[#d96b2a]"
                        >
                          Ekle
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.features.map((feature, index) => (
                          <span key={index} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">
                            {feature}
                            <button
                              type="button"
                              onClick={() => removeFeature(index)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Membership Types */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kullanıcı Tipleri
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.membershipTypes.includes("individual")}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({ ...prev, membershipTypes: [...prev.membershipTypes, "individual"] }));
                              } else {
                                setFormData(prev => ({ ...prev, membershipTypes: prev.membershipTypes.filter(t => t !== "individual") }));
                              }
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
                              if (e.target.checked) {
                                setFormData(prev => ({ ...prev, membershipTypes: [...prev.membershipTypes, "corporate"] }));
                              } else {
                                setFormData(prev => ({ ...prev, membershipTypes: prev.membershipTypes.filter(t => t !== "corporate") }));
                              }
                            }}
                            className="rounded border-gray-300 text-[#EC7830] focus:ring-[#EC7830]"
                          />
                          <span className="ml-2 text-sm text-gray-700">Kurumsal</span>
                        </label>
                      </div>
                    </div>

                    {/* Free Listing Configuration - Always show for all packages */}
                    <div className="space-y-4 border-t pt-4">
                      <h3 className="text-sm font-semibold text-gray-900">Ücretsiz İlan Konfigürasyonu</h3>
                      <p className="text-xs text-gray-600">Bu paket kullanıcıların ücretsiz ilan hakkı varsa ücretsiz, yoksa ücretli olarak görünür</p>
                      
                      {/* Free listing limits */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bireysel Ücretsiz Limit
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.freeListingLimitIndividual}
                            onChange={(e) => setFormData(prev => ({ ...prev, freeListingLimitIndividual: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kurumsal Ücretsiz Limit
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.freeListingLimitCorporate}
                            onChange={(e) => setFormData(prev => ({ ...prev, freeListingLimitCorporate: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Free Listing Reset Periods */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bireysel Üye Periyodu
                          </label>
                          <select
                            value={formData.freeResetPeriodIndividual}
                            onChange={(e) => setFormData(prev => ({ ...prev, freeResetPeriodIndividual: e.target.value as "monthly" | "yearly" | "once" }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                          >
                            <option value="monthly">Aylık</option>
                            <option value="yearly">Yıllık</option>
                            <option value="once">Tek Seferlik</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kurumsal Üye Periyodu
                          </label>
                          <select
                            value={formData.freeResetPeriodCorporate}
                            onChange={(e) => setFormData(prev => ({ ...prev, freeResetPeriodCorporate: e.target.value as "monthly" | "yearly" | "once" }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                          >
                            <option value="monthly">Aylık</option>
                            <option value="yearly">Yıllık</option>
                            <option value="once">Tek Seferlik</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Text configuration */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Paket Başlığı
                          </label>
                          <input
                            type="text"
                            value={formData.freeListingTitle}
                            onChange={(e) => setFormData(prev => ({ ...prev, freeListingTitle: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                            placeholder="Ücretsiz İlan"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Paket Açıklaması
                          </label>
                          <input
                            type="text"
                            value={formData.freeListingDescription}
                            onChange={(e) => setFormData(prev => ({ ...prev, freeListingDescription: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                            placeholder="Standart ilan özellikleri"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fiyat Metni
                          </label>
                          <input
                            type="text"
                            value={formData.freeListingPriceText}
                            onChange={(e) => setFormData(prev => ({ ...prev, freeListingPriceText: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                            placeholder="Ücretsiz"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Active/Inactive Status and Apply to Subcategories */}
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                            className="rounded border-gray-300 text-[#EC7830] focus:ring-[#EC7830]"
                          />
                          <span className="ml-2 text-sm text-gray-700">Paket aktif</span>
                        </label>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.applyToSubcategories}
                            onChange={(e) => setFormData(prev => ({ ...prev, applyToSubcategories: e.target.checked }))}
                            className="rounded border-gray-300 text-[#EC7830] focus:ring-[#EC7830]"
                          />
                          <span className="ml-2 text-sm text-gray-700">Alt kategorilere de uygula</span>
                        </label>
                      </div>
                      {formData.applyToSubcategories && (
                        <div className="ml-6 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                          ⚠️ Bu paket ayarları tüm alt kategorilere uygulanacak ve alt kategorilerde değiştirilemeyecek.
                        </div>
                      )}
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
                        disabled={isCreating || isUpdating || !formData.name.trim() || formData.features.length === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#EC7830] border border-transparent rounded-md hover:bg-[#d96b2a] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreating || isUpdating ? "Kaydediliyor..." : (editingPackage ? "Güncelle" : "Ekle")}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Add/Cancel buttons when in form mode */}
              {showForm && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      İptal Et
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}