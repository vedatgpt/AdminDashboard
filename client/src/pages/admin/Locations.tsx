import { useState, useMemo, useEffect } from "react";
import { Plus, Search, MapPin, AlertTriangle, CheckCircle, Info, ArrowLeft, ChevronRight, Edit, Trash2, GripVertical, Settings } from "lucide-react";
import Sortable from 'sortablejs';
import { useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";
import LocationForm from "@/components/LocationForm";
import { useLocationsTree, useCreateLocation, useUpdateLocation, useDeleteLocation } from "@/hooks/useLocations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Location, InsertLocation, UpdateLocation } from "@shared/schema";

export default function Locations() {
  const [location, setLocation] = useLocation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [parentLocation, setParentLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAlert, setShowAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  const queryClient = useQueryClient();

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

  // Show alert helper
  const showAlertMessage = (type: 'success' | 'error' | 'info', message: string, duration: number = 5000) => {
    setShowAlert({ type, message });
    setTimeout(() => setShowAlert(null), duration);
  };

  // Reorder mutation (TODO: Backend implementation needed)
  const reorderMutation = useMutation({
    mutationFn: async ({ parentId, locationIds }: { parentId: number | null; locationIds: number[] }) => {
      // For now, just simulate the API call
      console.log('Reorder locations:', { parentId, locationIds });
      // TODO: Implement actual API endpoint
      // const response = await fetch('/api/locations/reorder', {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ parentId, locationIds })
      // });
      // if (!response.ok) throw new Error('Failed to reorder locations');
      // return response.json();
      return Promise.resolve({ message: 'Simulated success' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      showAlertMessage('success', 'Lokasyon sıralaması başarıyla güncellendi', 1000);
    },
    onError: (error) => {
      showAlertMessage('error', 'Sıralama güncellenirken hata oluştu');
      console.error('Reorder error:', error);
    }
  });

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
  const handleDelete = (location: Location) => {
    if (!confirm(`"${location.name}" lokasyonunu silmek istediğinizden emin misiniz? Bu işlem alt lokasyonları da silecektir.`)) {
      return;
    }

    deleteMutation.mutate(location.id, {
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

  // Initialize SortableJS for locations
  useEffect(() => {
    // Use setTimeout to ensure DOM is ready
    const timer = setTimeout(() => {
      const sortableElement = document.querySelector("#hs-location-sortable");
      if (sortableElement && filteredLocations.length > 1) {
        // Destroy existing sortable instance if it exists
        const existingSortable = (sortableElement as any).sortableInstance;
        if (existingSortable) {
          existingSortable.destroy();
          (sortableElement as any).sortableInstance = null;
        }

        const sortableInstance = new Sortable(sortableElement as HTMLElement, {
          animation: 150,
          dragClass: 'rounded-none!',
          handle: '.drag-handle',
          onEnd: function (evt) {
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;
            
            if (oldIndex !== newIndex && oldIndex !== undefined && newIndex !== undefined) {
              // Create new array with reordered locations
              const reorderedLocations = [...filteredLocations];
              const [draggedLocation] = reorderedLocations.splice(oldIndex, 1);
              reorderedLocations.splice(newIndex, 0, draggedLocation);
              
              // Extract location IDs in new order
              const locationIds = reorderedLocations.map(loc => loc.id);
              
              // Send reorder request
              reorderMutation.mutate({
                parentId: currentParentId,
                locationIds: locationIds
              });
            }
          }
        });

        // Store instance for cleanup
        (sortableElement as any).sortableInstance = sortableInstance;
      }
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      const sortableElement = document.querySelector("#hs-location-sortable");
      if (sortableElement) {
        const existingSortable = (sortableElement as any).sortableInstance;
        if (existingSortable) {
          existingSortable.destroy();
          (sortableElement as any).sortableInstance = null;
        }
      }
    };
  }, [filteredLocations]);

  return (
    <div className="h-full flex flex-col">

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



      {/* Locations List */}
      <div className="w-full bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              onClick={() => setLocation('/admin/locations')}
              className={`hover:text-[#EC7830] transition-colors ${
                !currentParentId ? 'text-[#EC7830] font-medium' : ''
              }`}
            >
              Ülkeler
            </button>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.id} className="flex items-center space-x-2">
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => setLocation(`/admin/locations/${crumb.id}`)}
                  className={`hover:text-[#EC7830] transition-colors ${
                    index === breadcrumbs.length - 1 ? 'text-[#EC7830] font-medium' : ''
                  }`}
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Lokasyon ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-2 px-4 pl-10 pr-4 w-full sm:w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7830] focus:border-transparent text-sm"
              />
            </div>

            {/* Settings Button - Only show on root locations page */}
            {!currentParentId && (
              <button
                onClick={() => setLocation('/admin/locations/settings')}
                className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 w-full sm:w-auto justify-center sm:justify-start"
              >
                <Settings className="w-4 h-4" />
                Görünürlük Ayarları
              </button>
            )}

            {/* Add button */}
            <button
              onClick={() => {
                setParentLocation(currentParent);
                setEditingLocation(null);
                setIsFormOpen(true);
              }}
              className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d6691a] focus:outline-hidden focus:bg-[#d6691a] w-full sm:w-auto justify-center sm:justify-start"
            >
              <Plus className="w-4 h-4" />
              Yeni {getLocationTypeLabel(nextType)}
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#EC7830] border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-600">Lokasyonlar yükleniyor...</span>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>{searchTerm ? "Lokasyon bulunamadı" : `Henüz ${getLocationTypeLabel(nextType).toLowerCase()} eklenmemiş`}</p>
            <p className="text-sm mt-1">
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
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#EC7830] hover:bg-[#d6691a] mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni {getLocationTypeLabel(nextType)} Ekle
              </button>
            )}
          </div>
        ) : (
          <ul id="hs-location-sortable" className="flex flex-col">
            {filteredLocations.map((loc, index) => {
              const childrenCount = (loc as any).children ? (loc as any).children.length : 0;
              return (
                <li
                  key={loc.id}
                  className="inline-flex items-center gap-x-3 py-3 px-4 text-sm font-medium bg-white border border-gray-200 text-gray-800 -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg hover:bg-gray-50 transition-all duration-150 group relative sortable-item"
                  onClick={() => {
                    // Navigate to children if it's a clickable location type
                    if (loc.type !== 'neighborhood') {
                      setLocation(`/admin/locations/${loc.id}`);
                    }
                  }}
                >
                  {/* Location Icon */}
                  <MapPin className="shrink-0 w-4 h-4 text-gray-400" />
                  
                  {/* Location Name and Type */}
                  <div className="flex-1 text-left">
                    <span className="font-medium">{loc.name}</span>
                    
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    loc.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {loc.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                  
                  
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingLocation(loc);
                        setParentLocation(currentParent);
                        setIsFormOpen(true);
                      }}
                      className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                      title="Düzenle"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(loc);
                      }}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Drag Handle */}
                  <GripVertical className="shrink-0 w-4 h-4 text-gray-400 drag-handle cursor-grab hover:cursor-grabbing" />
                </li>
              );
            })}
          </ul>
          )}
        </div>
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