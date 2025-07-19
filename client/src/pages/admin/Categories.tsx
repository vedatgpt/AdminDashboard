import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Tags, Edit2, Trash2, FolderOpen, ChevronRight, ChevronDown, 
  Settings, Filter, SortAsc, Eye, X, Save, Type, List, CheckSquare, Hash,
  GripVertical, ArrowUpDown, Folder
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import type { 
  CategoryWithChildren, 
  Category, 
  InsertCategory,
  CategoryCustomField,
  InsertCustomField,
  CategoryFilter,
  InsertFilter,
  CustomFieldType
} from "@shared/schema";

// Sortable Category Item Component
function SortableCategoryItem({ 
  category, 
  level = 0, 
  onEdit, 
  onDelete, 
  onAddChild, 
  onViewDetail, 
  onViewSubcategories 
}: {
  category: CategoryWithChildren;
  level?: number;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentId: number) => void;
  onViewDetail: (category: Category) => void;
  onViewSubcategories: (category: Category) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-white mb-2 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div 
        className="flex items-center justify-between p-4 hover:bg-gray-50"
        style={{ paddingLeft: `${level * 20 + 16}px` }}
      >
        <div className="flex items-center gap-3">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          
          {category.children && category.children.length > 0 && (
            <button
              onClick={() => toggleExpanded(category.id)}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200"
            >
              {expandedItems.has(category.id) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          <FolderOpen className="w-5 h-5 text-gray-500" />
          <div>
            <h3 className="font-medium text-gray-900">{category.name}</h3>
            {category.description && (
              <p className="text-sm text-gray-500">{category.description}</p>
            )}
            <p className="text-xs text-gray-400">Sıra: {category.sortOrder}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            category.isActive 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          }`}>
            {category.isActive ? "Aktif" : "Pasif"}
          </span>
          
          <button
            onClick={() => onViewSubcategories(category)}
            className="p-1 text-gray-400 hover:text-purple-600 rounded hover:bg-gray-100"
            title="Alt kategorileri görüntüle"
          >
            <Folder className="w-4 h-4" />
          </button>

          <button
            onClick={() => onViewDetail(category)}
            className="p-1 text-gray-400 hover:text-green-600 rounded hover:bg-gray-100"
            title="Detayları görüntüle"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => onAddChild(category.id)}
            className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100"
            title="Alt kategori ekle"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onEdit(category)}
            className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100"
            title="Düzenle"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onDelete(category.id)}
            className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
            title="Sil"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {category.children && category.children.length > 0 && expandedItems.has(category.id) && (
        <div className="border-t">
          <CategoryTree 
            categories={category.children} 
            level={level + 1}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
            onViewDetail={onViewDetail}
            onViewSubcategories={onViewSubcategories}
          />
        </div>
      )}
    </div>
  );
}

// Category tree component for displaying hierarchical structure
function CategoryTree({ 
  categories, 
  level = 0, 
  onEdit, 
  onDelete, 
  onAddChild, 
  onViewDetail, 
  onViewSubcategories
}: {
  categories: CategoryWithChildren[];
  level?: number;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentId: number) => void;
  onViewDetail: (category: Category) => void;
  onViewSubcategories: (category: Category) => void;
}) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="space-y-1">
      {level === 0 ? (
        // Root level uses sortable items with DndContext
        categories.map((category) => (
          <SortableCategoryItem
            key={category.id}
            category={category}
            level={level}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
            onViewDetail={onViewDetail}
            onViewSubcategories={onViewSubcategories}
          />
        ))
      ) : (
        // Nested levels use regular items (no drag-drop for now)
        categories.map((category) => (
          <div key={category.id} className="border rounded-lg bg-white mb-2">
            <div 
              className="flex items-center justify-between p-4 hover:bg-gray-50"
              style={{ paddingLeft: `${level * 20 + 16}px` }}
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="w-5 h-5 text-gray-500" />
                <div>
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-gray-500">{category.description}</p>
                  )}
                  <p className="text-xs text-gray-400">Sıra: {category.sortOrder}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  category.isActive 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {category.isActive ? "Aktif" : "Pasif"}
                </span>

                <button
                  onClick={() => onViewDetail(category)}
                  className="p-1 text-gray-400 hover:text-green-600 rounded hover:bg-gray-100"
                  title="Detayları görüntüle"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onAddChild(category.id)}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100"
                  title="Alt kategori ekle"
                >
                  <Plus className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => onEdit(category)}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100"
                  title="Düzenle"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => onDelete(category.id)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {category.children && category.children.length > 0 && (
              <div className="border-t">
                <CategoryTree 
                  categories={category.children} 
                  level={level + 1}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddChild={onAddChild}
                  onViewDetail={onViewDetail}
                  onViewSubcategories={onViewSubcategories}
                />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// Category form modal
function CategoryModal({ isOpen, onClose, category, parentId }: {
  isOpen: boolean;
  onClose: () => void;
  category?: Category;
  parentId?: number;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    parentId: parentId || category?.parentId || null,
    isActive: category?.isActive ?? true,
    sortOrder: category?.sortOrder || 0,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Kategori oluşturulamadı");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      onClose();
      alert("Kategori başarıyla oluşturuldu");
    },
    onError: () => {
      alert("Kategori oluşturulurken hata oluştu");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Category>) => {
      const response = await fetch(`/api/admin/categories/${category!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Kategori güncellenemedi");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      onClose();
      alert("Kategori başarıyla güncellendi");
    },
    onError: () => {
      alert("Kategori güncellenirken hata oluştu");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (category) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {category ? "Kategori Düzenle" : "Yeni Kategori"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori Adı *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sıra Numarası
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Aktif kategori
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 px-4 py-2 bg-[#EC7830] text-white rounded-md hover:bg-[#d6691a] disabled:opacity-50"
            >
              {(createMutation.isPending || updateMutation.isPending) ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Category Detail Modal with Custom Fields and Filters Management
function CategoryDetailModal({ isOpen, onClose, category }: {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
}) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'fields' | 'filters' | 'sorting'>('fields');
  const [showCustomFieldForm, setShowCustomFieldForm] = useState(false);
  const [showFilterForm, setShowFilterForm] = useState(false);
  const [editingField, setEditingField] = useState<CategoryCustomField | undefined>();
  const [editingFilter, setEditingFilter] = useState<CategoryFilter | undefined>();

  // Fetch custom fields for this category
  const { data: customFields, refetch: refetchFields } = useQuery({
    queryKey: [`/api/admin/categories/${category.id}/custom-fields`],
    queryFn: async (): Promise<CategoryCustomField[]> => {
      const response = await fetch(`/api/admin/categories/${category.id}/custom-fields`);
      if (!response.ok) throw new Error("Custom fields alınamadı");
      return response.json();
    },
    enabled: isOpen,
  });

  // Fetch filters for this category
  const { data: filters, refetch: refetchFilters } = useQuery({
    queryKey: [`/api/admin/categories/${category.id}/filters`],
    queryFn: async (): Promise<CategoryFilter[]> => {
      const response = await fetch(`/api/admin/categories/${category.id}/filters`);
      if (!response.ok) throw new Error("Filtreler alınamadı");
      return response.json();
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{category.name} - Detaylar</h2>
            <p className="text-sm text-gray-500">{category.description || "Açıklama yok"}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'fields'
                ? 'border-[#EC7830] text-[#EC7830]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('fields')}
          >
            <Type className="w-4 h-4 inline-block mr-2" />
            Özel Alanlar ({customFields?.length || 0})
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'filters'
                ? 'border-[#EC7830] text-[#EC7830]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('filters')}
          >
            <Filter className="w-4 h-4 inline-block mr-2" />
            Filtreler ({filters?.filter(f => f.filterType === 'filter').length || 0})
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'sorting'
                ? 'border-[#EC7830] text-[#EC7830]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('sorting')}
          >
            <SortAsc className="w-4 h-4 inline-block mr-2" />
            Sıralama ({filters?.filter(f => f.filterType === 'sort').length || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'fields' && (
            <CustomFieldsTab
              categoryId={category.id}
              customFields={customFields || []}
              onRefetch={refetchFields}
              showForm={showCustomFieldForm}
              setShowForm={setShowCustomFieldForm}
              editingField={editingField}
              setEditingField={setEditingField}
            />
          )}
          
          {activeTab === 'filters' && (
            <FiltersTab
              categoryId={category.id}
              filters={filters?.filter(f => f.filterType === 'filter') || []}
              onRefetch={refetchFilters}
              showForm={showFilterForm}
              setShowForm={setShowFilterForm}
              editingFilter={editingFilter}
              setEditingFilter={setEditingFilter}
              filterType="filter"
            />
          )}
          
          {activeTab === 'sorting' && (
            <FiltersTab
              categoryId={category.id}
              filters={filters?.filter(f => f.filterType === 'sort') || []}
              onRefetch={refetchFilters}
              showForm={showFilterForm}
              setShowForm={setShowFilterForm}
              editingFilter={editingFilter}
              setEditingFilter={setEditingFilter}
              filterType="sort"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Custom Fields Tab Component
function CustomFieldsTab({ categoryId, customFields, onRefetch, showForm, setShowForm, editingField, setEditingField }: {
  categoryId: number;
  customFields: CategoryCustomField[];
  onRefetch: () => void;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  editingField?: CategoryCustomField;
  setEditingField: (field?: CategoryCustomField) => void;
}) {
  const queryClient = useQueryClient();

  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: number) => {
      const response = await fetch(`/api/admin/categories/custom-fields/${fieldId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Özel alan silinemedi");
      return response.json();
    },
    onSuccess: () => {
      onRefetch();
      alert("Özel alan başarıyla silindi");
    },
  });

  const handleEdit = (field: CategoryCustomField) => {
    setEditingField(field);
    setShowForm(true);
  };

  const handleDelete = (fieldId: number) => {
    if (confirm("Bu özel alanı silmek istediğinizden emin misiniz?")) {
      deleteFieldMutation.mutate(fieldId);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingField(undefined);
  };

  const getFieldTypeIcon = (type: CustomFieldType) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4" />;
      case 'select': return <List className="w-4 h-4" />;
      case 'checkbox': return <CheckSquare className="w-4 h-4" />;
      case 'number-range': return <Hash className="w-4 h-4" />;
      default: return <Type className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Özel Alanlar</h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-[#EC7830] text-white rounded-lg hover:bg-[#d6691a] text-sm"
        >
          <Plus className="w-4 h-4 inline-block mr-2" />
          Yeni Özel Alan
        </button>
      </div>

      {showForm && (
        <CustomFieldForm
          categoryId={categoryId}
          field={editingField}
          onClose={handleCloseForm}
          onSuccess={onRefetch}
        />
      )}

      {customFields.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Type className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Bu kategori için özel alan tanımlanmamış</p>
          <p className="text-sm">İlanlar için özel veri alanları oluşturun</p>
        </div>
      ) : (
        <div className="space-y-3">
          {customFields.map((field) => (
            <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getFieldTypeIcon(field.fieldType as CustomFieldType)}
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {field.fieldName}
                      {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </h4>
                    <p className="text-sm text-gray-500 capitalize">{field.fieldType}</p>
                    {field.placeholder && (
                      <p className="text-xs text-gray-400">Placeholder: {field.placeholder}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(field)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(field.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {field.options && (
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Seçenekler:</strong> {JSON.stringify(field.options)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Custom Field Form Component
function CustomFieldForm({ categoryId, field, onClose, onSuccess }: {
  categoryId: number;
  field?: CategoryCustomField;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    fieldName: field?.fieldName || "",
    fieldType: (field?.fieldType as CustomFieldType) || "text",
    isRequired: field?.isRequired || false,
    placeholder: field?.placeholder || "",
    options: field?.options || null,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCustomField) => {
      const response = await fetch(`/api/admin/categories/${categoryId}/custom-fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Özel alan oluşturulamadı");
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      onClose();
      alert("Özel alan başarıyla oluşturuldu");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<CategoryCustomField>) => {
      const response = await fetch(`/api/admin/categories/custom-fields/${field!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Özel alan güncellenemedi");
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      onClose();
      alert("Özel alan başarıyla güncellendi");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let processedOptions = formData.options;
    if (formData.fieldType === 'select' && typeof processedOptions === 'string') {
      processedOptions = processedOptions.split(',').map(opt => opt.trim());
    }

    const submitData = {
      ...formData,
      options: processedOptions,
    };

    if (field) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">{field ? 'Özel Alan Düzenle' : 'Yeni Özel Alan'}</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alan Adı *
          </label>
          <input
            type="text"
            value={formData.fieldName}
            onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alan Tipi *
          </label>
          <select
            value={formData.fieldType}
            onChange={(e) => setFormData({ ...formData, fieldType: e.target.value as CustomFieldType })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
          >
            <option value="text">Metin</option>
            <option value="select">Seçim Listesi</option>
            <option value="checkbox">Onay Kutusu</option>
            <option value="number-range">Sayı Aralığı</option>
          </select>
        </div>

        {(formData.fieldType === 'select' || formData.fieldType === 'number-range') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.fieldType === 'select' ? 'Seçenekler (virgülle ayırın)' : 'Aralık (JSON format: {"min": 0, "max": 100})'}
            </label>
            <input
              type="text"
              value={typeof formData.options === 'string' ? formData.options : JSON.stringify(formData.options)}
              onChange={(e) => setFormData({ ...formData, options: e.target.value })}
              placeholder={formData.fieldType === 'select' ? 'Seçenek 1, Seçenek 2, Seçenek 3' : '{"min": 0, "max": 100}'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Placeholder Metni
          </label>
          <input
            type="text"
            value={formData.placeholder}
            onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isRequired"
            checked={formData.isRequired}
            onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="isRequired" className="text-sm text-gray-700">
            Zorunlu alan
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex-1 px-4 py-2 bg-[#EC7830] text-white rounded-md hover:bg-[#d6691a] disabled:opacity-50"
          >
            {(createMutation.isPending || updateMutation.isPending) ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Filters Tab Component (separate for filters and sorting)
function FiltersTab({ categoryId, filters, onRefetch, showForm, setShowForm, editingFilter, setEditingFilter, filterType }: {
  categoryId: number;
  filters: CategoryFilter[];
  onRefetch: () => void;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  editingFilter?: CategoryFilter;
  setEditingFilter: (filter?: CategoryFilter) => void;
  filterType: 'filter' | 'sort';
}) {
  const deleteFilterMutation = useMutation({
    mutationFn: async (filterId: number) => {
      const response = await fetch(`/api/admin/categories/filters/${filterId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Filtre silinemedi");
      return response.json();
    },
    onSuccess: () => {
      onRefetch();
      alert("Filtre başarıyla silindi");
    },
  });

  const handleEdit = (filter: CategoryFilter) => {
    setEditingFilter(filter);
    setShowForm(true);
  };

  const handleDelete = (filterId: number) => {
    if (confirm("Bu filtreyi silmek istediğinizden emin misiniz?")) {
      deleteFilterMutation.mutate(filterId);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingFilter(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{filterType === 'filter' ? 'Filtreler' : 'Sıralama Seçenekleri'}</h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-[#EC7830] text-white rounded-lg hover:bg-[#d6691a] text-sm"
        >
          <Plus className="w-4 h-4 inline-block mr-2" />
          {filterType === 'filter' ? 'Yeni Filtre' : 'Yeni Sıralama'}
        </button>
      </div>

      {showForm && (
        <FilterForm
          categoryId={categoryId}
          filter={editingFilter}
          onClose={handleCloseForm}
          onSuccess={onRefetch}
          defaultFilterType={filterType}
        />
      )}

      {filters.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {filterType === 'filter' ? <Filter className="w-12 h-12 mx-auto mb-3 text-gray-300" /> : <SortAsc className="w-12 h-12 mx-auto mb-3 text-gray-300" />}
          <p>Bu kategori için {filterType === 'filter' ? 'filtre' : 'sıralama seçeneği'} tanımlanmamış</p>
          <p className="text-sm">{filterType === 'filter' ? 'İlanları filtrelemek için filtreler oluşturun' : 'İlanları sıralamak için seçenekler oluşturun'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filters.map((filter) => (
            <div key={filter.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {filter.filterType === 'sort' ? <SortAsc className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {filter.label}
                      {filter.isDefault && <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Varsayılan</span>}
                    </h4>
                    <p className="text-sm text-gray-500 capitalize">{filter.filterType} - {filter.fieldName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(filter)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(filter.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {filter.options && (
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Seçenekler:</strong> {JSON.stringify(filter.options)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Filter Form Component
function FilterForm({ categoryId, filter, onClose, onSuccess, defaultFilterType }: {
  categoryId: number;
  filter?: CategoryFilter;
  onClose: () => void;
  onSuccess: () => void;
  defaultFilterType?: 'filter' | 'sort';
}) {
  const [formData, setFormData] = useState({
    filterType: filter?.filterType || defaultFilterType || "filter",
    fieldName: filter?.fieldName || "",
    label: filter?.label || "",
    options: filter?.options || null,
    isDefault: filter?.isDefault || false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertFilter) => {
      const response = await fetch(`/api/admin/categories/${categoryId}/filters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Filtre oluşturulamadı");
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      onClose();
      alert("Filtre başarıyla oluşturuldu");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<CategoryFilter>) => {
      const response = await fetch(`/api/admin/categories/filters/${filter!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Filtre güncellenemedi");
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      onClose();
      alert("Filtre başarıyla güncellendi");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let processedOptions = formData.options;
    if (typeof processedOptions === 'string') {
      try {
        processedOptions = JSON.parse(processedOptions);
      } catch {
        processedOptions = processedOptions.split(',').map(opt => opt.trim());
      }
    }

    const submitData = {
      ...formData,
      options: processedOptions,
    };

    if (filter) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">{filter ? 'Filtre Düzenle' : 'Yeni Filtre'}</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filtre Tipi *
          </label>
          <select
            value={formData.filterType}
            onChange={(e) => setFormData({ ...formData, filterType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
          >
            <option value="filter">Filtre</option>
            <option value="sort">Sıralama</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alan Adı *
          </label>
          <input
            type="text"
            value={formData.fieldName}
            onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
            placeholder="price, createdAt, name vs."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Görünen Ad *
          </label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder="Fiyat, Tarih, İsim vs."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seçenekler (JSON format)
          </label>
          <input
            type="text"
            value={typeof formData.options === 'string' ? formData.options : JSON.stringify(formData.options)}
            onChange={(e) => setFormData({ ...formData, options: e.target.value })}
            placeholder={formData.filterType === 'sort' ? '["asc", "desc"]' : '["option1", "option2"]'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EC7830]"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isDefault"
            checked={formData.isDefault}
            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="isDefault" className="text-sm text-gray-700">
            Varsayılan {formData.filterType === 'sort' ? 'sıralama' : 'filtre'}
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex-1 px-4 py-2 bg-[#EC7830] text-white rounded-md hover:bg-[#d6691a] disabled:opacity-50"
          >
            {(createMutation.isPending || updateMutation.isPending) ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Subcategories Modal Component
function SubcategoriesModal({ isOpen, onClose, category }: {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
}) {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [draggedCategory, setDraggedCategory] = useState<number | null>(null);

  // Fetch subcategories for this category
  const { data: subcategories, isLoading } = useQuery({
    queryKey: [`/api/admin/categories/subcategories/${category.id}`],
    queryFn: async (): Promise<CategoryWithChildren[]> => {
      const response = await fetch("/api/admin/categories");
      if (!response.ok) throw new Error("Kategoriler alınamadı");
      const allCategories: CategoryWithChildren[] = await response.json();
      
      // Filter to get only direct subcategories of this category
      const findSubcategories = (categories: CategoryWithChildren[]): CategoryWithChildren[] => {
        const result: CategoryWithChildren[] = [];
        categories.forEach(cat => {
          if (cat.parentId === category.id) {
            result.push(cat);
          }
          if (cat.children && cat.children.length > 0) {
            result.push(...findSubcategories(cat.children));
          }
        });
        return result;
      };
      
      return findSubcategories(allCategories);
    },
    enabled: isOpen,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kategori silinemedi");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/categories/subcategories/${category.id}`] });
      alert("Kategori başarıyla silindi");
    },
    onError: (error: any) => {
      alert(error.message || "Kategori silinirken hata oluştu");
    },
  });

  const handleEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddChild = (parentId: number) => {
    setSelectedCategory(undefined);
    setShowModal(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{category.name} - Alt Kategoriler</h2>
            <p className="text-sm text-gray-500">{category.description || "Açıklama yok"}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-4 border-b bg-gray-50">
          <button
            onClick={() => handleAddChild(category.id)}
            className="px-4 py-2 bg-[#EC7830] text-white rounded-lg hover:bg-[#d6691a] text-sm"
          >
            <Plus className="w-4 h-4 inline-block mr-2" />
            Alt Kategori Ekle
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-gray-500">Alt kategoriler yükleniyor...</div>
            </div>
          ) : subcategories && subcategories.length > 0 ? (
            <div className="space-y-3">
              {subcategories.map((subcat) => (
                <div key={subcat.id} className="border rounded-lg p-4 bg-white hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                      <FolderOpen className="w-5 h-5 text-gray-500" />
                      <div>
                        <h4 className="font-medium text-gray-900">{subcat.name}</h4>
                        {subcat.description && (
                          <p className="text-sm text-gray-500">{subcat.description}</p>
                        )}
                        <p className="text-xs text-gray-400">Sıra: {subcat.sortOrder}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        subcat.isActive 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {subcat.isActive ? "Aktif" : "Pasif"}
                      </span>
                      
                      <button
                        onClick={() => handleEdit(subcat)}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100"
                        title="Düzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(subcat.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900 mb-2">Alt kategori yok</p>
              <p className="text-gray-500">Bu kategoriye alt kategori eklemek için yukarıdaki butonu kullanın.</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Edit Modal */}
      <CategoryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        category={selectedCategory}
        parentId={category.id}
      />
    </div>
  );
}

export default function Categories() {
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [parentId, setParentId] = useState<number | undefined>();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<Category | undefined>();
  const [showSubcategoriesModal, setShowSubcategoriesModal] = useState(false);
  const [selectedCategoryForSubs, setSelectedCategoryForSubs] = useState<Category | undefined>();
  const [draggedCategory, setDraggedCategory] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/admin/categories"],
    queryFn: async (): Promise<CategoryWithChildren[]> => {
      const response = await fetch("/api/admin/categories");
      if (!response.ok) throw new Error("Kategoriler alınamadı");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kategori silinemedi");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      alert("Kategori başarıyla silindi");
    },
    onError: (error: any) => {
      alert(error.message || "Kategori silinirken hata oluştu");
    },
  });

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setParentId(undefined);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddChild = (parentCategoryId: number) => {
    setSelectedCategory(undefined);
    setParentId(parentCategoryId);
    setShowModal(true);
  };

  const handleAddRoot = () => {
    setSelectedCategory(undefined);
    setParentId(undefined);
    setShowModal(true);
  };

  const handleViewDetail = (category: Category) => {
    setSelectedCategoryDetail(category);
    setShowDetailModal(true);
  };

  const handleViewSubcategories = (category: Category) => {
    setSelectedCategoryForSubs(category);
    setShowSubcategoriesModal(true);
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update category sort order via drag and drop
  const updateCategoryOrder = useMutation({
    mutationFn: async (updates: { id: number; sortOrder: number }[]) => {
      const promises = updates.map(update => 
        fetch(`/api/admin/categories/${update.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: update.sortOrder }),
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id && categories) {
      const oldIndex = categories.findIndex(cat => cat.id === active.id);
      const newIndex = categories.findIndex(cat => cat.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedCategories = arrayMove(categories, oldIndex, newIndex);
        
        // Update sort orders
        const updates = reorderedCategories.map((cat, index) => ({
          id: cat.id,
          sortOrder: index + 1
        }));
        
        updateCategoryOrder.mutate(updates);
      }
    }
  };

  const totalCategories = categories ? 
    categories.reduce((count, cat) => {
      const countChildren = (category: CategoryWithChildren): number => {
        return 1 + (category.children?.reduce((acc, child) => acc + countChildren(child), 0) || 0);
      };
      return count + countChildren(cat);
    }, 0) : 0;

  return (
    <div>
      <PageHeader
        title="Kategori Yönetimi"
        subtitle={`Toplam ${totalCategories} kategori`}
        actions={
          <button 
            onClick={handleAddRoot}
            className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d6691a] focus:outline-hidden focus:bg-[#d6691a] disabled:opacity-50 disabled:pointer-events-none"
          >
            <Plus className="w-4 h-4" />
            Ana Kategori Ekle
          </button>
        }
      />

      <div className="bg-white rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Kategoriler yükleniyor...</div>
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="p-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={categories.map(cat => cat.id)} strategy={verticalListSortingStrategy}>
                <CategoryTree 
                  categories={categories}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild}
                  onViewDetail={handleViewDetail}
                  onViewSubcategories={handleViewSubcategories}
                />
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              icon={Tags}
              title="Henüz kategori yok"
              description="İlk kategoriyi eklemek için 'Ana Kategori Ekle' butonuna tıklayın."
            />
          </div>
        )}
      </div>

      <CategoryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        category={selectedCategory}
        parentId={parentId}
      />

      {selectedCategoryDetail && (
        <CategoryDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          category={selectedCategoryDetail}
        />
      )}

      {selectedCategoryForSubs && (
        <SubcategoriesModal
          isOpen={showSubcategoriesModal}
          onClose={() => setShowSubcategoriesModal(false)}
          category={selectedCategoryForSubs}
        />
      )}
    </div>
  );
}