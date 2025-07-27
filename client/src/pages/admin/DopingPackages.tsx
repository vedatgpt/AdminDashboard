import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Search, Package, AlertTriangle, CheckCircle, Info, Edit, Trash2, GripVertical, DollarSign, Calendar, List, ToggleLeft, ToggleRight } from "lucide-react";
import Sortable from 'sortablejs';
import PageHeader from "@/components/PageHeader";
import DopingPackageForm from "@/components/DopingPackageForm";
import { useDopingPackages, useCreateDopingPackage, useUpdateDopingPackage, useDeleteDopingPackage, useReorderDopingPackages } from "@/hooks/useDopingPackages";
import type { DopingPackage, InsertDopingPackage, UpdateDopingPackage } from "@shared/schema";

export default function DopingPackages() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<DopingPackage | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAlert, setShowAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const sortableContainerRef = useRef<HTMLDivElement>(null);

  // Queries and mutations
  const { data: packages = [], isLoading, error } = useDopingPackages();
  const createMutation = useCreateDopingPackage();
  const updateMutation = useUpdateDopingPackage();
  const deleteMutation = useDeleteDopingPackage();
  const reorderMutation = useReorderDopingPackages();

  // Show alert helper
  const showAlertMessage = (type: 'success' | 'error' | 'info', message: string, duration: number = 5000) => {
    setShowAlert({ type, message });
    setTimeout(() => setShowAlert(null), duration);
  };

  // Filter packages based on search
  const filteredPackages = useMemo(() => {
    if (!searchTerm) return packages;
    return packages.filter(pkg => 
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.description && pkg.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [packages, searchTerm]);

  // Initialize sortable for drag & drop reordering
  useEffect(() => {
    let sortable: Sortable | null = null;

    if (sortableContainerRef.current && filteredPackages.length > 0) {
      try {
        sortable = Sortable.create(sortableContainerRef.current, {
          animation: 150,
          handle: '.drag-handle',
          ghostClass: 'opacity-50',
          chosenClass: 'border-orange-500',
          onEnd: (evt) => {
            if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
              const newOrder = [...filteredPackages];
              const [removed] = newOrder.splice(evt.oldIndex, 1);
              newOrder.splice(evt.newIndex, 0, removed);
              
              const packageIds = newOrder.map(pkg => pkg.id);
              reorderMutation.mutate(packageIds);
            }
          }
        });
      } catch (error) {
        console.error('Sortable initialization failed:', error);
      }
    }

    return () => {
      if (sortable) {
        sortable.destroy();
      }
    };
  }, [filteredPackages, reorderMutation]);

  // Handle form submission
  const handleFormSubmit = async (data: InsertDopingPackage | UpdateDopingPackage) => {
    try {
      if (editingPackage) {
        await updateMutation.mutateAsync({ id: editingPackage.id, updates: data });
        showAlertMessage('success', 'Doping paketi başarıyla güncellendi');
      } else {
        await createMutation.mutateAsync(data as InsertDopingPackage);
        showAlertMessage('success', 'Doping paketi başarıyla oluşturuldu');
      }
      setIsFormOpen(false);
      setEditingPackage(null);
    } catch (error: any) {
      showAlertMessage('error', error.message || 'İşlem başarısız');
    }
  };

  // Handle delete
  const handleDelete = async (dopingPackage: DopingPackage) => {
    if (confirm(`"${dopingPackage.name}" paketini silmek istediğinize emin misiniz?`)) {
      try {
        await deleteMutation.mutateAsync(dopingPackage.id);
        showAlertMessage('success', 'Doping paketi başarıyla silindi');
      } catch (error: any) {
        showAlertMessage('error', error.message || 'Silme işlemi başarısız');
      }
    }
  };

  // Handle edit
  const handleEdit = (dopingPackage: DopingPackage) => {
    setEditingPackage(dopingPackage);
    setIsFormOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingPackage(null);
    setIsFormOpen(true);
  };

  // Parse features from JSON string
  const parseFeatures = (featuresJson: string | null): string[] => {
    if (!featuresJson) return [];
    try {
      const features = JSON.parse(featuresJson);
      return Array.isArray(features) ? features : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doping Paketleri"
        description="İlan doping paketlerini yönetin"
        icon={Package}
      />

      {/* Alert Messages */}
      {showAlert && (
        <div className={`rounded-lg p-4 flex items-center gap-3 ${
          showAlert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          showAlert.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {showAlert.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
          {showAlert.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600" />}
          {showAlert.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
          <span className="text-sm font-medium">{showAlert.message}</span>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Doping paketlerinde ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Add New Package Button */}
        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Paket
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Doping paketleri yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Doping paketleri yüklenirken hata oluştu</p>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Arama kriterlerine uygun doping paketi bulunamadı' : 'Henüz doping paketi bulunmuyor'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              İlk Paketi Oluştur
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div ref={sortableContainerRef} className="divide-y divide-gray-200">
            {filteredPackages.map((dopingPackage) => {
              const features = parseFeatures(dopingPackage.features);
              const priceInTL = (dopingPackage.price / 100).toFixed(2);
              
              return (
                <div
                  key={dopingPackage.id}
                  className="group flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Drag Handle */}
                    <div className="drag-handle cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Package Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-gray-900">{dopingPackage.name}</h3>
                        {dopingPackage.isActive ? (
                          <ToggleRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      
                      {dopingPackage.description && (
                        <p className="text-sm text-gray-600 mb-2">{dopingPackage.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {priceInTL} TL
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {dopingPackage.durationDays} gün
                        </div>
                        {features.length > 0 && (
                          <div className="flex items-center gap-1">
                            <List className="w-4 h-4" />
                            {features.length} özellik
                          </div>
                        )}
                      </div>
                      
                      {features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {features.map((feature, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(dopingPackage)}
                      className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(dopingPackage)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form Modal */}
      <DopingPackageForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPackage(null);
        }}
        onSubmit={handleFormSubmit}
        dopingPackage={editingPackage}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}