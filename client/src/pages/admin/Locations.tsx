import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Plus, MapPin, ArrowLeft, Edit, Trash2, Eye } from "lucide-react";

import { apiRequest } from "@/lib/queryClient";
import type { Location, InsertLocation } from "@shared/schema";



export default function Locations() {
  const [location, navigate] = useLocation();
  const [match, params] = useRoute("/admin/locations/:parentId?");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const queryClient = useQueryClient();

  const currentParentId = params?.parentId === 'root' ? null : (params?.parentId ? parseInt(params.parentId) : null);

  // Get current locations
  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ['/api/locations', currentParentId, 'children'],
    queryFn: () => apiRequest(`/api/locations/${currentParentId || 'root'}/children`) as Promise<Location[]>,
  });

  // Get breadcrumbs for current location
  const { data: breadcrumbs = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations', currentParentId, 'breadcrumbs'],
    queryFn: () => currentParentId ? apiRequest(`/api/locations/${currentParentId}/breadcrumbs`) as Promise<Location[]> : Promise.resolve([]),
    enabled: !!currentParentId,
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertLocation) => 
      fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      setShowAddModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<InsertLocation>) => 
      fetch(`/api/locations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      setShowEditModal(false);
      setEditingLocation(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      fetch(`/api/locations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
    },
  });

  const handleCreate = (data: Omit<InsertLocation, 'parentId'>) => {
    createMutation.mutate({
      ...data,
      parentId: currentParentId,
    });
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setShowEditModal(true);
  };

  const handleUpdate = (data: Partial<InsertLocation>) => {
    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, ...data });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Bu lokasyonu silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const getLocationTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      country: 'Ülke',
      city: 'Şehir', 
      district: 'İlçe',
      neighborhood: 'Mahalle'
    };
    return types[type] || type;
  };

  const getNextLocationType = (currentType?: string) => {
    const typeFlow = ['country', 'city', 'district', 'neighborhood'];
    if (!currentType) return 'country';
    const currentIndex = typeFlow.indexOf(currentType);
    return typeFlow[currentIndex + 1] || 'neighborhood';
  };

  const hasChildren = (location: Location) => {
    return locations.some((loc: Location) => loc.parentId === location.id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {currentParentId && (
            <button
              onClick={() => {
                const parentBreadcrumb = breadcrumbs[breadcrumbs.length - 2];
                navigate(parentBreadcrumb ? `/admin/locations/${parentBreadcrumb.id}` : '/admin/locations');
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lokasyonlar</h1>
            <p className="text-gray-600">
              {breadcrumbs.length > 0 ? breadcrumbs.map(b => b.name).join(' > ') : 'Ana Lokasyonlar'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d6691a] focus:outline-hidden focus:bg-[#d6691a]"
        >
          <Plus className="w-4 h-4" />
          Lokasyon Ekle
        </button>
      </div>

      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button
            onClick={() => navigate('/admin/locations')}
            className="hover:text-[#EC7830]"
          >
            Ana Lokasyonlar
          </button>
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={breadcrumb.id} className="flex items-center space-x-2">
              <span>&gt;</span>
              <button
                onClick={() => navigate(`/admin/locations/${breadcrumb.id}`)}
                className={`hover:text-[#EC7830] ${index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : ''}`}
              >
                {breadcrumb.name}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Locations Grid */}
      {isLoading ? (
        <div className="text-center py-8">Yükleniyor...</div>
      ) : locations.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz lokasyon yok</h3>
          <p className="text-gray-600 mb-4">İlk lokasyonu eklemek için yukarıdaki butona tıklayın.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location: Location) => (
            <div key={location.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      {getLocationTypeLabel(location.type)}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{location.name}</h3>
                  <p className="text-sm text-gray-600">
                    İlan Sayısı: {location.adCount}
                  </p>
                </div>
                <div className="flex space-x-1">
                  {hasChildren(location) && (
                    <button
                      onClick={() => navigate(`/admin/locations/${location.id}`)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Alt lokasyonları görüntüle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(location)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Düzenle"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(location.id)}
                    className="p-1 hover:bg-red-100 rounded text-red-600"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {hasChildren(location) && (
                <button
                  onClick={() => navigate(`/admin/locations/${location.id}`)}
                  className="mt-3 w-full text-left text-sm text-[#EC7830] hover:text-[#d6691a] font-medium"
                >
                  Alt lokasyonları görüntüle →
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Location Modal */}
      {showAddModal && (
        <LocationModal
          title="Yeni Lokasyon Ekle"
          onSubmit={handleCreate}
          onClose={() => setShowAddModal(false)}
          isSubmitting={createMutation.isPending}
          defaultType={getNextLocationType(breadcrumbs[breadcrumbs.length - 1]?.type)}
        />
      )}

      {/* Edit Location Modal */}
      {showEditModal && editingLocation && (
        <LocationModal
          title="Lokasyon Düzenle"
          location={editingLocation}
          onSubmit={handleUpdate}
          onClose={() => {
            setShowEditModal(false);
            setEditingLocation(null);
          }}
          isSubmitting={updateMutation.isPending}
        />
      )}
    </div>
  );
}

interface LocationModalProps {
  title: string;
  location?: Location;
  onSubmit: (data: any) => void;
  onClose: () => void;
  isSubmitting: boolean;
  defaultType?: string;
}

function LocationModal({ title, location, onSubmit, onClose, isSubmitting, defaultType }: LocationModalProps) {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    type: location?.type || defaultType || 'country',
    slug: location?.slug || '',
    sortOrder: location?.sortOrder || 0,
    isActive: location?.isActive ?? true,
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ş/g, 's')
      .replace(/ü/g, 'u')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: location ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-medium mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lokasyon Adı
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#EC7830] focus:border-[#EC7830]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tip
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#EC7830] focus:border-[#EC7830]"
              required
            >
              <option value="country">Ülke</option>
              <option value="city">Şehir</option>
              <option value="district">İlçe</option>
              <option value="neighborhood">Mahalle</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#EC7830] focus:border-[#EC7830]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sıralama
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#EC7830] focus:border-[#EC7830]"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Aktif
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-[#EC7830] text-white rounded-md hover:bg-[#d6691a] disabled:opacity-50"
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
