import { useState, useEffect } from "react";
import { useCategoryPackages } from "@/hooks/useCategoryPackages";
import type { CategoryPackage } from "@shared/schema";
import { ChevronUp, ChevronDown } from "lucide-react";

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
    applyToSubcategories: false,
    isActive: true,
  });

  const [freeListingData, setFreeListingData] = useState({
    freeListingLimitIndividual: 0,
    freeResetPeriodIndividual: "monthly" as "monthly" | "yearly" | "once",
    freeListingLimitCorporate: 0,
    freeResetPeriodCorporate: "monthly" as "monthly" | "yearly" | "once",
    applyToSubcategories: true,
    // Text content fields
    freeListingTitle: "Ücretsiz İlan",
    freeListingDescription: "Standart ilan özelliklerini kullanın",
    freeListingPriceText: "Ücretsiz",
  });

  const [inheritedSettings, setInheritedSettings] = useState<{
    hasInheritance: boolean;
    parentCategory?: any;
    inheritedLimits?: {
      individual: number;
      corporate: number;
    };
    hasTextInheritance: boolean;
    textParentCategory?: any;
  }>({
    hasInheritance: false,
    hasTextInheritance: false
  });

  const [activeTab, setActiveTab] = useState<"packages" | "free">("packages");
  
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
        applyToSubcategories: (editingPackage as any).applyToSubcategories || false,
        isActive: editingPackage.isActive,
      });
      setShowForm(true);
    }
  }, [editingPackage]);

  // Initialize free listing data and check inheritance when category changes
  useEffect(() => {
    if (category && isOpen) {
      // Fetch the full category data to get the latest free listing settings
      fetch(`/api/categories/flat`)
        .then(response => response.json())
        .then(categories => {
          console.log(`🔧 CHECKING INHERITANCE for ${category.name} (ID: ${category.id})`);
          console.log(`🔄 Flat categories count: ${categories.length}`);
          
          const fullCategory = categories.find((cat: any) => cat.id === category.id);
          console.log(`📊 Full category data:`, fullCategory);
          if (fullCategory?.parentId) {
            console.log(`⬆️ Has parent: ${fullCategory.parentId}`);
          }
          
          if (fullCategory) {
            // Check if this category inherits from parent
            let hasInheritance = false;
            let parentCategory = null;
            let inheritedLimits = null;

            if (fullCategory.parentId) {
              // Find parent category with inheritance enabled
              const findParentWithInheritance = (catId: number): any => {
                const parent = categories.find((cat: any) => cat.id === catId);
                if (parent && parent.applyToSubcategories === true) {
                  console.log(`✅ INHERITANCE FOUND: ${parent.name} -> Corporate: ${parent.freeListingLimitCorporate}, Individual: ${parent.freeListingLimitIndividual}`);
                  return parent;
                }
                // Check parent's parent recursively
                if (parent && parent.parentId) {
                  return findParentWithInheritance(parent.parentId);
                }
                return null;
              };

              parentCategory = findParentWithInheritance(fullCategory.parentId);
              if (parentCategory) {
                hasInheritance = true;
                inheritedLimits = {
                  individual: parentCategory.freeListingLimitIndividual || 0,
                  corporate: parentCategory.freeListingLimitCorporate || 0
                };
                console.log(`Inheritance detected for ${fullCategory.name} from ${parentCategory.name}:`, inheritedLimits);
              } else {
                console.log(`No inheritance found for ${fullCategory.name}`);
              }
            }

            if (hasInheritance) {
              console.log(`🎯 INHERITANCE ACTIVE: ${fullCategory.name} inherits from ${parentCategory?.name}`);
            } else {
              console.log(`🎯 NO INHERITANCE: ${fullCategory.name} uses own settings`);
            }

            // Check for text content inheritance
            let hasTextInheritance = false;
            let textParentCategory = null;

            if (fullCategory.parentId) {
              const findParentWithTextContent = (catId: number): any => {
                const parent = categories.find((cat: any) => cat.id === catId);
                if (parent && parent.applyToSubcategories === true) {
                  const hasCustomTitle = parent.freeListingTitle && parent.freeListingTitle !== "Ücretsiz İlan";
                  const hasCustomDescription = parent.freeListingDescription && parent.freeListingDescription !== "Standart ilan özelliklerini kullanın";
                  const hasCustomPriceText = parent.freeListingPriceText && parent.freeListingPriceText !== "Ücretsiz";
                  
                  if (hasCustomTitle || hasCustomDescription || hasCustomPriceText) {
                    console.log(`✅ TEXT INHERITANCE FOUND: ${parent.name} has custom text content`);
                    return parent;
                  }
                }
                // Check parent's parent recursively
                if (parent && parent.parentId) {
                  return findParentWithTextContent(parent.parentId);
                }
                return null;
              };

              textParentCategory = findParentWithTextContent(fullCategory.parentId);
              if (textParentCategory) {
                hasTextInheritance = true;
                console.log(`Text inheritance detected for ${fullCategory.name} from ${textParentCategory.name}`);
              }
            }

            setInheritedSettings({
              hasInheritance,
              parentCategory,
              inheritedLimits: inheritedLimits || { individual: 0, corporate: 0 },
              hasTextInheritance,
              textParentCategory
            });

            setFreeListingData({
              freeListingLimitIndividual: fullCategory.freeListingLimitIndividual || 0,
              freeResetPeriodIndividual: fullCategory.freeResetPeriodIndividual || "monthly",
              freeListingLimitCorporate: fullCategory.freeListingLimitCorporate || 0,
              freeResetPeriodCorporate: fullCategory.freeResetPeriodCorporate || "monthly",
              applyToSubcategories: fullCategory.applyToSubcategories !== false,
              // Text content fields
              freeListingTitle: fullCategory.freeListingTitle || "Ücretsiz İlan",
              freeListingDescription: fullCategory.freeListingDescription || "Standart ilan özelliklerini kullanın",
              freeListingPriceText: fullCategory.freeListingPriceText || "Ücretsiz",
            });
          }
        })
        .catch(error => {
          console.error("❌ Error fetching category data:", error);
        });
    }
  }, [category, isOpen]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      durationDays: 30,
      features: [],
      membershipTypes: ["individual", "corporate"],
      applyToSubcategories: false,
      isActive: true,
    });
    setNewFeature("");
    setEditingPackage(null);
    setShowForm(false);
  };

  const handleFreeListingSettingsSave = async () => {
    if (!category) return;

    try {
      const response = await fetch(`/api/categories/${category.id}/free-listing-settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(freeListingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save settings");
      }

      const updatedCategory = await response.json();
      
      // Update the local freeListingData state with the saved values
      setFreeListingData({
        freeListingLimitIndividual: updatedCategory.freeListingLimitIndividual || 0,
        freeResetPeriodIndividual: updatedCategory.freeResetPeriodIndividual || "monthly",
        freeListingLimitCorporate: updatedCategory.freeListingLimitCorporate || 0,
        freeResetPeriodCorporate: updatedCategory.freeResetPeriodCorporate || "monthly",
        applyToSubcategories: updatedCategory.applyToSubcategories || true,
        // Text content fields
        freeListingTitle: updatedCategory.freeListingTitle || "Ücretsiz İlan",
        freeListingDescription: updatedCategory.freeListingDescription || "Standart ilan özelliklerini kullanın",
        freeListingPriceText: updatedCategory.freeListingPriceText || "Ücretsiz",
      });

      // CRITICAL: Invalidate all category caches to force fresh data
      if (typeof window !== 'undefined' && (window as any).queryClient) {
        const queryClient = (window as any).queryClient;
        // Clear all category-related caches
        await queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/categories/flat'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/categories', 'tree'] });
        // Also clear specific category cache for the updated category
        await queryClient.invalidateQueries({ queryKey: [`/api/categories/${category.id}`] });
        // Clear all cached data to force complete refresh
        await queryClient.clear();
        console.log('🚀 CACHE INVALIDATED: Complete cache clear after admin update');
      }

      // Show a temporary success notification in the UI
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
      notification.textContent = '✅ Ücretsiz ilan ayarları başarıyla kaydedildi';
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
      
    } catch (error) {
      console.error("Error saving free listing settings:", error);
      
      // Show error notification
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
      errorNotification.textContent = '❌ Ayarlar kaydedilirken hata oluştu';
      document.body.appendChild(errorNotification);
      
      setTimeout(() => {
        document.body.removeChild(errorNotification);
      }, 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.name.trim()) {
      alert("⚠️ Paket adı gereklidir");
      return;
    }
    
    if (formData.features.length === 0) {
      alert("⚠️ En az bir paket özelliği eklemelisiniz");
      return;
    }
    
    if (formData.membershipTypes.length === 0) {
      alert("⚠️ En az bir üyelik türü seçmelisiniz");
      return;
    }
    
    if (formData.price <= 0) {
      alert("⚠️ Paket fiyatı 0'dan büyük olmalıdır");
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

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newOrder = [...packages];
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      const packageIds = newOrder.map(pkg => pkg.id);
      reorderPackages(packageIds);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < packages.length - 1) {
      const newOrder = [...packages];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      const packageIds = newOrder.map(pkg => pkg.id);
      reorderPackages(packageIds);
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
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            <button
              onClick={() => setActiveTab("packages")}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === "packages"
                  ? "bg-white text-[#EC7830] shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Premium Paketler
            </button>
            <button
              onClick={() => setActiveTab("free")}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === "free"
                  ? "bg-white text-[#EC7830] shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Ücretsiz İlan Ayarları
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC7830]"></div>
              <p className="mt-2 text-gray-600">Yükleniyor...</p>
            </div>
          ) : (
            <div>
              {/* Tab Content */}
              {activeTab === "packages" && (
                <div>
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

                    {/* Apply to Subcategories */}
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.applyToSubcategories}
                          onChange={(e) => setFormData(prev => ({ ...prev, applyToSubcategories: e.target.checked }))}
                          className="rounded border-gray-300 text-[#EC7830] focus:ring-[#EC7830]"
                        />
                        <span className="ml-2 text-sm text-gray-700">Alt kategorilere de uygula</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        Bu paket alt kategoriler için de kullanılabilir olur
                      </p>
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

                    {/* Active/Inactive Status */}
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
                </div>
              )}

              {/* Free Listing Settings Tab */}
              {activeTab === "free" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Ücretsiz İlan Sistemi</h3>
                      <p className="mt-1 text-sm text-blue-700">
                        Bu kategoride kullanıcıların ücretsiz ilan verebilme limitlerini ve koşullarını belirleyin.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Inheritance Warning */}
                {inheritedSettings.hasInheritance && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Ücretsiz İlan Ayarları (Üst Kategoriden Devralınıyor)</h3>
                        <p className="mt-1 text-sm text-yellow-700">
                          Bu kategori "{inheritedSettings.parentCategory?.name}" kategorisinden ayarları devralmaktadır.
                          Değişiklik yapmak için üst kategoriyi düzenleyin.
                        </p>
                        <div className="mt-2">
                          <button
                            type="button"
                            className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                            onClick={() => {
                              console.log(`🎯 Navigating to parent category: ${inheritedSettings.parentCategory?.name} (ID: ${inheritedSettings.parentCategory?.id})`);
                              // Close current modal and navigate to parent category
                              onClose();
                              // Trigger parent category modal opening
                              // Note: This needs to be implemented in Categories.tsx
                              window.dispatchEvent(new CustomEvent('openCategoryPackages', {
                                detail: { 
                                  category: {
                                    id: inheritedSettings.parentCategory?.id,
                                    name: inheritedSettings.parentCategory?.name
                                  }
                                }
                              }));
                            }}
                          >
                            "{inheritedSettings.parentCategory?.name}" Kategorisini Düzenle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <form className="space-y-6">
                  {/* Free Listing Text Content Section */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Ücretsiz İlan Metin İçerikleri</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Step-5 sayfasında gösterilen ücretsiz ilan kutusundaki metinleri düzenleyin.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {/* Free Listing Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Başlık *
                        </label>
                        <input
                          type="text"
                          value={freeListingData.freeListingTitle}
                          onChange={(e) => setFreeListingData(prev => ({ ...prev, freeListingTitle: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                          placeholder="Ücretsiz İlan"
                        />
                      </div>

                      {/* Free Listing Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Açıklama *
                        </label>
                        <input
                          type="text"
                          value={freeListingData.freeListingDescription}
                          onChange={(e) => setFreeListingData(prev => ({ ...prev, freeListingDescription: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                          placeholder="Standart ilan özelliklerini kullanın"
                        />
                      </div>

                      {/* Free Listing Price Text */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fiyat Metni *
                        </label>
                        <input
                          type="text"
                          value={freeListingData.freeListingPriceText}
                          onChange={(e) => setFreeListingData(prev => ({ ...prev, freeListingPriceText: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                          placeholder="Ücretsiz"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bireysel Kullanıcılar Ayarları */}
                  <div className={`${inheritedSettings.hasInheritance ? 'bg-gray-100' : 'bg-gray-50'} p-4 rounded-lg`}>
                    <h4 className={`text-md font-medium ${inheritedSettings.hasInheritance ? 'text-gray-600' : 'text-gray-900'} mb-3`}>
                      Bireysel Kullanıcılar
                      {inheritedSettings.hasInheritance && (
                        <span className="ml-2 text-xs text-gray-500">(Üst kategoriden: {inheritedSettings.inheritedLimits?.individual} ilan)</span>
                      )}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ücretsiz İlan Limiti
                        </label>
                        <input
                          type="number"
                          min="0"
                          className={`py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-[#EC7830] focus:ring-[#EC7830] ${
                            inheritedSettings.hasInheritance ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''
                          }`}
                          value={inheritedSettings.hasInheritance ? inheritedSettings.inheritedLimits?.individual || 0 : freeListingData.freeListingLimitIndividual}
                          onChange={(e) => !inheritedSettings.hasInheritance && setFreeListingData({
                            ...freeListingData,
                            freeListingLimitIndividual: parseInt(e.target.value) || 0
                          })}
                          disabled={inheritedSettings.hasInheritance}
                          readOnly={inheritedSettings.hasInheritance}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Yenileme Periyodu
                        </label>
                        <select
                          className={`py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-[#EC7830] focus:ring-[#EC7830] ${
                            inheritedSettings.hasInheritance ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''
                          }`}
                          value={freeListingData.freeResetPeriodIndividual}
                          onChange={(e) => !inheritedSettings.hasInheritance && setFreeListingData({
                            ...freeListingData,
                            freeResetPeriodIndividual: e.target.value as "monthly" | "yearly" | "once"
                          })}
                          disabled={inheritedSettings.hasInheritance}
                        >
                          <option value="monthly">Aylık</option>
                          <option value="yearly">Yıllık</option>
                          <option value="once">Tek Seferlik</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Kurumsal Kullanıcılar Ayarları */}
                  <div className={`${inheritedSettings.hasInheritance ? 'bg-gray-100' : 'bg-gray-50'} p-4 rounded-lg`}>
                    <h4 className={`text-md font-medium ${inheritedSettings.hasInheritance ? 'text-gray-600' : 'text-gray-900'} mb-3`}>
                      Kurumsal Kullanıcılar
                      {inheritedSettings.hasInheritance && (
                        <span className="ml-2 text-xs text-gray-500">(Üst kategoriden: {inheritedSettings.inheritedLimits?.corporate} ilan)</span>
                      )}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ücretsiz İlan Limiti
                        </label>
                        <input
                          type="number"
                          min="0"
                          className={`py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-[#EC7830] focus:ring-[#EC7830] ${
                            inheritedSettings.hasInheritance ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''
                          }`}
                          value={inheritedSettings.hasInheritance ? inheritedSettings.inheritedLimits?.corporate || 0 : freeListingData.freeListingLimitCorporate}
                          onChange={(e) => !inheritedSettings.hasInheritance && setFreeListingData({
                            ...freeListingData,
                            freeListingLimitCorporate: parseInt(e.target.value) || 0
                          })}
                          disabled={inheritedSettings.hasInheritance}
                          readOnly={inheritedSettings.hasInheritance}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Yenileme Periyodu
                        </label>
                        <select
                          className={`py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-[#EC7830] focus:ring-[#EC7830] ${
                            inheritedSettings.hasInheritance ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''
                          }`}
                          value={freeListingData.freeResetPeriodCorporate}
                          onChange={(e) => !inheritedSettings.hasInheritance && setFreeListingData({
                            ...freeListingData,
                            freeResetPeriodCorporate: e.target.value as "monthly" | "yearly" | "once"
                          })}
                          disabled={inheritedSettings.hasInheritance}
                        >
                          <option value="monthly">Aylık</option>
                          <option value="yearly">Yıllık</option>
                          <option value="once">Tek Seferlik</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Text Content Settings - Only show if NO text inheritance */}
                  {!inheritedSettings.hasTextInheritance && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900">Metin İçeriği Ayarları</h4>

                      <div className="grid grid-cols-1 gap-4">
                        {/* Free Listing Title */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Başlık <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-[#EC7830] focus:ring-[#EC7830]"
                            value={freeListingData.freeListingTitle}
                            onChange={(e) => setFreeListingData({
                              ...freeListingData,
                              freeListingTitle: e.target.value
                            })}
                            placeholder="Ücretsiz İlan"
                          />
                        </div>

                        {/* Free Listing Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Açıklama <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-[#EC7830] focus:ring-[#EC7830]"
                            value={freeListingData.freeListingDescription}
                            onChange={(e) => setFreeListingData({
                              ...freeListingData,
                              freeListingDescription: e.target.value
                            })}
                            placeholder="Standart ilan özelliklerini kullanın"
                          />
                        </div>

                        {/* Free Listing Price Text */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fiyat Metni <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-[#EC7830] focus:ring-[#EC7830]"
                            value={freeListingData.freeListingPriceText}
                            onChange={(e) => setFreeListingData({
                              ...freeListingData,
                              freeListingPriceText: e.target.value
                            })}
                            placeholder="Ücretsiz"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Text Content Inheritance Warning - Only show if has text inheritance */}
                  {inheritedSettings.hasTextInheritance && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">Metin İçeriği (Üst Kategoriden Devralınıyor)</h3>
                          <p className="mt-1 text-sm text-yellow-700">
                            Bu kategori "{inheritedSettings.textParentCategory?.name}" kategorisinden metin içeriğini devralmaktadır.
                            Değişiklik yapmak için üst kategoriyi düzenleyin.
                          </p>
                          <div className="mt-2">
                            <button
                              type="button"
                              className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                              onClick={() => {
                                console.log(`🎯 Navigating to text parent category: ${inheritedSettings.textParentCategory?.name} (ID: ${inheritedSettings.textParentCategory?.id})`);
                                onClose();
                                window.dispatchEvent(new CustomEvent('openCategoryPackages', {
                                  detail: { 
                                    category: {
                                      id: inheritedSettings.textParentCategory?.id,
                                      name: inheritedSettings.textParentCategory?.name
                                    }
                                  }
                                }));
                              }}
                            >
                              "{inheritedSettings.textParentCategory?.name}" Kategorisini Düzenle
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Apply to Subcategories - Only visible if not inherited */}
                  {(!inheritedSettings.hasInheritance || !inheritedSettings.hasTextInheritance) && (
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={freeListingData.applyToSubcategories}
                          onChange={(e) => setFreeListingData(prev => ({ 
                            ...prev, 
                            applyToSubcategories: e.target.checked 
                          }))}
                          className="rounded border-gray-300 text-[#EC7830] focus:ring-[#EC7830]"
                        />
                        <span className="ml-2 text-sm text-gray-700">Alt kategorilere de uygula</span>
                      </label>
                      <p className="mt-1 ml-6 text-xs text-gray-500">
                        Bu ayarlar alt kategoriler için de geçerli olacak
                      </p>
                    </div>
                  )}

                  {/* Save Button - Only visible if not inherited */}
                  {(!inheritedSettings.hasInheritance || !inheritedSettings.hasTextInheritance) && (
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleFreeListingSettingsSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#EC7830] rounded-md hover:bg-[#d96b2a]"
                      >
                        Ayarları Kaydet
                      </button>
                    </div>
                  )}
                </form>
              </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}