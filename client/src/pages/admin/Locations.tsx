import { useState, useMemo } from "react";
import { Plus, Search, MapPin, AlertTriangle, CheckCircle, Info, ArrowLeft, ChevronRight, Edit, Trash2, GripVertical } from "lucide-react";
import { useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";
import LocationForm from "@/components/LocationForm";
import { useLocationsTree, useCreateLocation, useUpdateLocation, useDeleteLocation } from "@/hooks/useLocations";
import type { Location, InsertLocation, UpdateLocation } from "@shared/schema";

export default function Locations() {
  const [location, setLocation] = useLocation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [parentLocation, setParentLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAlert, setShowAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Extract current parent ID from URL
  const currentParentId = useMemo(() => {
    const match = location.match(/\/admin\/locations\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }, [location]);

  // Queries and mutations
  const { data: locations = [], isLoading, error } = useLocationsTree();
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();

  // Get locations to display based on current parent
  const currentLocations = useMemo(() => {
    if (currentParentId === null) {
      // Show only root locations (countries)
      return locations.filter(loc => loc.parentId === null);
    } else {
      // Show children of current parent
      const findLocationAndChildren = (locs: Location[]): Location[] => {
        for (const loc of locs) {
          if (loc.id === currentParentId) {
            return (loc as any).children || [];
          }
          if ((loc as any).children) {
            const found = findLocationAndChildren((loc as any).children);
            if (found.length > 0) return found;
          }
        }
        return [];
      };
      return findLocationAndChildren(locations);
    }
  }, [locations, currentParentId]);

  // Get current parent location for breadcrumb
  const currentParent = useMemo(() => {
    if (currentParentId === null) return null;
    
    const findLocation = (locs: Location[]): Location | null => {
      for (const loc of locs) {
        if (loc.id === currentParentId) return loc;
        if ((loc as any).children) {
          const found = findLocation((loc as any).children);
          if (found) return found;
        }
      }
      return null;
    };
    return findLocation(locations);
  }, [locations, currentParentId]);

  // Build breadcrumb trail
  const breadcrumbs = useMemo(() => {
    if (!currentParentId || !locations.length) return [];
    
    const buildBreadcrumbs = (locs: Location[], targetId: number, trail: Location[] = []): Location[] => {
      for (const loc of locs) {
        const newTrail = [...trail, loc];
        if (loc.id === targetId) {
          return newTrail;
        }
        if ((loc as any).children) {
          const found = buildBreadcrumbs((loc as any).children, targetId, newTrail);
          if (found.length > 0) return found;
        }
      }
      return [];
    };
    
    return buildBreadcrumbs(locations, currentParentId);
  }, [locations, currentParentId]);

  // Filter locations based on search term
  const filteredLocations = useMemo(() => {
    if (!searchTerm) return currentLocations;
    return currentLocations.filter(loc => 
      loc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentLocations, searchTerm]);

  // Get next location type based on current level
  const getNextType = (parentType?: string): string => {
    if (!parentType) return "country";
    switch (parentType) {
      case "country": return "city";
      case "city": return "district";
      case "district": return "neighborhood";
      default: return "neighborhood";
    }
  };

  const getLocationTypeLabel = (type: string): string => {
    switch (type) {
      case "country": return "Ülke";
      case "city": return "Şehir";
      case "district": return "İlçe";
      case "neighborhood": return "Mahalle";
      default: return type;
    }
  };

  const nextType = getNextType(currentParent?.type);

  // Handle create location
  const handleCreate = (data: InsertLocation) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setShowAlert({ type: 'success', message: 'Lokasyon başarıyla eklendi' });
        setTimeout(() => setShowAlert(null), 3000);
      },
      onError: () => {
        setShowAlert({ type: 'error', message: 'Lokasyon eklenirken hata oluştu' });
        setTimeout(() => setShowAlert(null), 3000);
      }
    });
  };

  // Handle update location
  const handleUpdate = (data: InsertLocation) => {
    if (!editingLocation) return;
    
    updateMutation.mutate({ id: editingLocation.id, data: data as UpdateLocation }, {
      onSuccess: () => {
        setEditingLocation(null);
        setShowAlert({ type: 'success', message: 'Lokasyon başarıyla güncellendi' });
        setTimeout(() => setShowAlert(null), 3000);
      },
      onError: () => {
        setShowAlert({ type: 'error', message: 'Lokasyon güncellenirken hata oluştu' });
        setTimeout(() => setShowAlert(null), 3000);
      }
    });
  };

  // Handle delete location
  const handleDelete = (id: number, name: string) => {
    if (!confirm(`"${name}" lokasyonunu silmek istediğinizden emin misiniz? Bu işlem alt lokasyonları da silecektir.`)) {
      return;
    }

    deleteMutation.mutate(id, {
      onSuccess: () => {
        setShowAlert({ type: 'success', message: 'Lokasyon başarıyla silindi' });
        setTimeout(() => setShowAlert(null), 3000);
      },
      onError: () => {
        setShowAlert({ type: 'error', message: 'Lokasyon silinirken hata oluştu' });
        setTimeout(() => setShowAlert(null), 3000);
      }
    });
  };

  // Navigate to location children
  const navigateToChildren = (locationId: number) => {
    setLocation(`/admin/locations/${locationId}`);
  };

  // Navigate back
  const navigateBack = () => {
    if (breadcrumbs.length <= 1) {
      setLocation('/admin/locations');
    } else {
      const parentBreadcrumb = breadcrumbs[breadcrumbs.length - 2];
      setLocation(`/admin/locations/${parentBreadcrumb.id}`);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Hata</h3>
              <p className="mt-1 text-sm text-red-700">
                Lokasyonlar yüklenirken hata oluştu. Lütfen sayfayı yenileyin.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Lokasyon Yönetimi" 
        subtitle="Ülke, şehir, ilçe ve mahalle bilgilerini yönetin"
      />

      {/* Alert */}
      {showAlert && (
        <div className={`rounded-md p-4 ${
          showAlert.type === 'success' ? 'bg-green-50 border border-green-200' :
          showAlert.type === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {showAlert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-400" />}
              {showAlert.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-400" />}
              {showAlert.type === 'info' && <Info className="h-5 w-5 text-blue-400" />}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                showAlert.type === 'success' ? 'text-green-800' :
                showAlert.type === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {showAlert.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Back button */}
          {currentParentId && (
            <button
              onClick={navigateBack}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </button>
          )}
          
          {/* Breadcrumb */}
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span>Lokasyonlar</span>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id} className="flex items-center gap-1">
                  <ChevronRight className="h-4 w-4" />
                  <button
                    onClick={() => {
                      if (index === breadcrumbs.length - 1) return;
                      setLocation(`/admin/locations/${crumb.id}`);
                    }}
                    className={`hover:text-gray-900 ${
                      index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : ''
                    }`}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Lokasyon ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 w-64"
            />
          </div>

          {/* Add button */}
          <button
            onClick={() => {
              setParentLocation(currentParent);
              setEditingLocation(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni {getLocationTypeLabel(nextType)}
          </button>
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
            <p className="mt-2">Lokasyonlar yükleniyor...</p>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "Lokasyon bulunamadı" : `Henüz ${getLocationTypeLabel(nextType).toLowerCase()} eklenmemiş`}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? "Arama kriterlerinize uygun lokasyon bulunamadı."
                : `İlk ${getLocationTypeLabel(nextType).toLowerCase()}ünüzü ekleyerek başlayın.`
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  setParentLocation(currentParent);
                  setEditingLocation(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni {getLocationTypeLabel(nextType)} Ekle
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lokasyon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tip
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sıra
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <button
                            onClick={() => {
                              if (loc.type !== 'neighborhood') {
                                navigateToChildren(loc.id);
                              }
                            }}
                            className={`text-sm font-medium text-gray-900 ${
                              loc.type !== 'neighborhood' ? 'hover:text-orange-600' : ''
                            }`}
                            disabled={loc.type === 'neighborhood'}
                          >
                            {loc.name}
                          </button>
                          {(loc as any).children && (
                            <p className="text-xs text-gray-500">
                              {(loc as any).children.length} alt lokasyon
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {getLocationTypeLabel(loc.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        loc.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {loc.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {loc.sortOrder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingLocation(loc);
                            setParentLocation(currentParent);
                            setIsFormOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(loc.id, loc.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Location Form Modal */}
      <LocationForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingLocation(null);
          setParentLocation(null);
        }}
        onSubmit={editingLocation ? handleUpdate : handleCreate}
        editingLocation={editingLocation}
        parentLocation={parentLocation}
        nextType={nextType}
      />
    </div>
  );
}