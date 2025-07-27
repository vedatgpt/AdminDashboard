import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import type { ListingPackage, InsertListingPackage, UpdateListingPackage } from "@shared/schema";

interface ListingPackageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InsertListingPackage | UpdateListingPackage) => void;
  listingPackage?: ListingPackage | null;
  isLoading?: boolean;
}

export default function ListingPackageForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  listingPackage, 
  isLoading = false 
}: ListingPackageFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basePrice: 0,
    durationDays: 30,
    features: "[]",
    maxPhotos: 20,
    isActive: true,
    sortOrder: 0,
  });

  const [featuresArray, setFeaturesArray] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedMembershipTypes, setSelectedMembershipTypes] = useState<string[]>([]);

  // Fetch categories for selection
  const { data: categories = [] } = useCategories();

  // Reset form when modal opens/closes or listingPackage changes
  useEffect(() => {
    if (isOpen) {
      if (listingPackage) {
        setFormData({
          name: listingPackage.name || "",
          description: listingPackage.description || "",
          basePrice: listingPackage.basePrice || 0,
          durationDays: listingPackage.durationDays || 30,
          features: listingPackage.features || "[]",
          maxPhotos: listingPackage.maxPhotos || 20,
          isActive: listingPackage.isActive ?? true,
          sortOrder: listingPackage.sortOrder || 0,
        });
        
        try {
          const parsedFeatures = JSON.parse(listingPackage.features || "[]");
          setFeaturesArray(Array.isArray(parsedFeatures) ? parsedFeatures : []);
        } catch {
          setFeaturesArray([]);
        }

        // TODO: Load existing category and membership type selections from database
        // For now, keep empty arrays as placeholders
        setSelectedCategories([]);
        setSelectedMembershipTypes([]);
      } else {
        setFormData({
          name: "",
          description: "",
          basePrice: 0,
          durationDays: 30,
          features: "[]",
          maxPhotos: 20,
          isActive: true,
          sortOrder: 0,
        });
        setFeaturesArray([]);
      }
    }
  }, [isOpen, listingPackage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation checks
    if (selectedCategories.length === 0) {
      alert('En az bir kategori seçmelisiniz');
      return;
    }

    if (selectedMembershipTypes.length === 0) {
      alert('En az bir üyelik tipi seçmelisiniz');
      return;
    }
    
    const submitData = {
      ...formData,
      features: JSON.stringify(featuresArray),
      selectedCategories,
      selectedMembershipTypes,
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
              {listingPackage ? "İlan Paketi Düzenle" : "Yeni İlan Paketi"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
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
                placeholder="Örn: Ücretsiz İlan, Premium İlan, Vitrin İlan"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                placeholder="Paket hakkında açıklama"
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
                  value={Math.floor(formData.basePrice / 100)}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseInt(e.target.value) * 100 || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                  placeholder="50"
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
                  onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
                  placeholder="30"
                />
              </div>
            </div>

            {/* Max Photos */}
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

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geçerli Kategoriler
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                {categories.filter(cat => !cat.parentId).map((mainCategory) => (
                  <div key={mainCategory.id}>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(mainCategory.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, mainCategory.id]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(id => id !== mainCategory.id));
                          }
                        }}
                        className="w-4 h-4 text-[#EC7830] bg-gray-100 border-gray-300 rounded focus:ring-[#EC7830] focus:ring-2"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-900">{mainCategory.name}</span>
                    </label>
                    
                    {/* Sub-categories */}
                    <div className="ml-6 mt-1 space-y-1">
                      {categories.filter(cat => cat.parentId === mainCategory.id).map((subCategory) => (
                        <label key={subCategory.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(subCategory.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, subCategory.id]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(id => id !== subCategory.id));
                              }
                            }}
                            className="w-4 h-4 text-[#EC7830] bg-gray-100 border-gray-300 rounded focus:ring-[#EC7830] focus:ring-2"
                          />
                          <span className="ml-2 text-sm text-gray-700">{subCategory.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Bu paket hangi kategorilerde kullanılabilir olacak?
              </p>
            </div>

            {/* Membership Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geçerli Üyelik Tipleri
              </label>
              <div className="space-y-2">
                {['individual', 'corporate', 'authorized_personnel'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedMembershipTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembershipTypes([...selectedMembershipTypes, type]);
                        } else {
                          setSelectedMembershipTypes(selectedMembershipTypes.filter(t => t !== type));
                        }
                      }}
                      className="w-4 h-4 text-[#EC7830] bg-gray-100 border-gray-300 rounded focus:ring-[#EC7830] focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-900">
                      {type === 'individual' ? 'Bireysel Üyeler' : 
                       type === 'corporate' ? 'Kurumsal Üyeler' :
                       'Yetkili Kişiler'}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Bu paket hangi üyelik tiplerinde kullanılabilir olacak?
              </p>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paket Özellikleri
              </label>
              <div className="space-y-2">
                {featuresArray.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EC7830] focus:border-transparent"
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
                  className="text-[#EC7830] hover:text-[#d6691a] text-sm font-medium"
                >
                  + Özellik Ekle
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Paketinizin sunacağı özellikler (vitrin, öne çıkarma, rozet vs.)
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durum
              </label>
              <div className="hs-form-check hs-form-switch">
                <input
                  type="checkbox"
                  id="hs-form-switch-with-label"
                  className="hs-form-switch-input relative shrink-0 w-11 h-6 bg-gray-100 checked:bg-none checked:bg-[#EC7830] border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 ring-transparent disabled:opacity-50 disabled:pointer-events-none checked:focus:bg-[#EC7830] focus:checked:border-[#EC7830] focus:ring-offset-white before:inline-block before:w-5 before:h-5 before:bg-white checked:before:bg-white before:translate-x-0 checked:before:translate-x-full before:shadow before:rounded-full before:transform before:ring-0 before:transition before:ease-in-out before:duration-200"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="hs-form-switch-with-label" className="text-sm text-gray-500 ms-3">
                  {formData.isActive ? 'Aktif' : 'Pasif'}
                </label>
              </div>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sıralama
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

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 mt-6">
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
              className="flex-1 px-4 py-2 bg-[#EC7830] text-white rounded-lg hover:bg-[#d6691a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Kaydediliyor..." : (listingPackage ? "Güncelle" : "Oluştur")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}