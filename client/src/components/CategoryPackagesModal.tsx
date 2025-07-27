import { useState, useMemo } from "react";
import { X, Plus, Search, Edit, Trash2, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useCategoryPackages, useCreateCategoryPackage, useUpdateCategoryPackage, useDeleteCategoryPackage, useListingPackages } from "@/hooks/useCategoryPackages";
import type { Category } from "@shared/schema";
import type { CategoryPackage, CreateCategoryPackageData } from "@/hooks/useCategoryPackages";

interface CategoryPackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
}

export default function CategoryPackagesModal({ isOpen, onClose, category }: CategoryPackagesModalProps) {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CategoryPackage | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAlert, setShowAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Form state for adding new package
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [categoryPrice, setCategoryPrice] = useState<string>("");
  const [editPrice, setEditPrice] = useState<string>("");

  // Fetch category packages and available packages
  const { data: categoryPackages = [], isLoading } = useCategoryPackages(category.id);
  const { data: allPackages = [] } = useListingPackages();
  const createMutation = useCreateCategoryPackage(category.id);
  const updateMutation = useUpdateCategoryPackage(category.id);
  const deleteMutation = useDeleteCategoryPackage(category.id);

  // Filter out packages already assigned to this category
  const availablePackages = useMemo(() => {
    const assignedPackageIds = new Set(categoryPackages.map(cp => cp.id));
    return allPackages.filter(pkg => !assignedPackageIds.has(pkg.id));
  }, [allPackages, categoryPackages]);

  // Apply search filter
  const filteredPackages = useMemo(() => {
    if (!searchTerm) return categoryPackages;
    return categoryPackages.filter(pkg => 
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.description && pkg.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [categoryPackages, searchTerm]);

  const showAlertMessage = (type: 'success' | 'error' | 'info', message: string, duration = 3000) => {
    setShowAlert({ type, message });
    setTimeout(() => setShowAlert(null), duration);
  };

  const handleAddPackage = async () => {
    if (!selectedPackageId || !categoryPrice) {
      showAlertMessage('error', 'Lütfen paket ve fiyat seçin');
      return;
    }

    try {
      const data: CreateCategoryPackageData = {
        packageId: selectedPackageId,
        price: Math.round(parseFloat(categoryPrice) * 100), // Convert to cents
      };
      await createMutation.mutateAsync(data);
      showAlertMessage('success', 'Paket kategoriye başarıyla eklendi');
      setIsAddFormOpen(false);
      setSelectedPackageId(null);
      setCategoryPrice("");
    } catch (error: any) {
      showAlertMessage('error', error.message || 'Paket eklenirken hata oluştu');
    }
  };

  const handleUpdatePrice = async (categoryPackageId: number) => {
    if (!editPrice) {
      showAlertMessage('error', 'Lütfen fiyat girin');
      return;
    }

    try {
      await updateMutation.mutateAsync({ 
        id: categoryPackageId, 
        price: Math.round(parseFloat(editPrice) * 100) // Convert to cents
      });
      showAlertMessage('success', 'Fiyat başarıyla güncellendi');
      setEditingPackage(null);
      setEditPrice("");
    } catch (error: any) {
      showAlertMessage('error', error.message || 'Fiyat güncellenirken hata oluştu');
    }
  };

  const handleRemovePackage = async (categoryPackageId: number) => {
    if (!confirm('Bu paketi kategoriden kaldırmak istediğinize emin misiniz?')) return;
    
    try {
      await deleteMutation.mutateAsync(categoryPackageId);
      showAlertMessage('success', 'Paket kategoriden kaldırıldı');
    } catch (error: any) {
      showAlertMessage('error', error.message || 'Paket kaldırılırken hata oluştu');
    }
  };

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {category.name} - İlan Paketleri
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Bu kategoriye atanmış paketleri yönetin
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Alert Messages */}
        {showAlert && (
          <div className={`mx-6 mt-4 p-4 rounded-lg flex items-center gap-3 ${
            showAlert.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            showAlert.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {showAlert.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {showAlert.type === 'error' && <AlertTriangle className="w-5 h-5" />}
            {showAlert.type === 'info' && <Info className="w-5 h-5" />}
            <span>{showAlert.message}</span>
          </div>
        )}

        {/* Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Paket ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <button
              onClick={() => setIsAddFormOpen(true)}
              className="ml-4 inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Paket Ekle
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <Plus className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Henüz paket eklenmemiş
              </h3>
              <p className="text-gray-600">
                Bu kategoriye paket eklemek için "Paket Ekle" butonunu kullanın.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPackages.map((pkg) => (
                <div key={pkg.categoryPackageId} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{pkg.name}</h3>
                      {pkg.description && (
                        <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Süre: {pkg.durationDays} gün</span>
                        <span>Max Fotoğraf: {pkg.maxPhotos}</span>
                        <span className="capitalize">{pkg.membershipType}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {editingPackage?.categoryPackageId === pkg.categoryPackageId ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            placeholder="Fiyat"
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <button
                            onClick={() => handleUpdatePrice(pkg.categoryPackageId)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={() => {
                              setEditingPackage(null);
                              setEditPrice("");
                            }}
                            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">
                            {formatPrice(pkg.categoryPrice)} TL
                          </span>
                          <button
                            onClick={() => {
                              setEditingPackage(pkg);
                              setEditPrice(formatPrice(pkg.categoryPrice));
                            }}
                            className="text-orange-600 hover:text-orange-700 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemovePackage(pkg.categoryPackageId)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Package Modal */}
      {isAddFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Kategoriye Paket Ekle</h3>
              <button
                onClick={() => {
                  setIsAddFormOpen(false);
                  setSelectedPackageId(null);
                  setCategoryPrice("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paket Seç
                  </label>
                  <select
                    value={selectedPackageId || ""}
                    onChange={(e) => setSelectedPackageId(Number(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Paket seçin...</option>
                    {availablePackages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({pkg.membershipType})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori Fiyatı (TL)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={categoryPrice}
                    onChange={(e) => setCategoryPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsAddFormOpen(false);
                    setSelectedPackageId(null);
                    setCategoryPrice("");
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddPackage}
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}