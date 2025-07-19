import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Tags, Edit2, Trash2, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import type { CategoryWithChildren, Category, InsertCategory } from "@shared/schema";

// Category tree component for displaying hierarchical structure
function CategoryTree({ categories, level = 0, onEdit, onDelete, onAddChild }: {
  categories: CategoryWithChildren[];
  level?: number;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentId: number) => void;
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
      {categories.map((category) => (
        <div key={category.id} className="border rounded-lg bg-white">
          <div 
            className="flex items-center justify-between p-4 hover:bg-gray-50"
            style={{ paddingLeft: `${level * 20 + 16}px` }}
          >
            <div className="flex items-center gap-3">
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
              />
            </div>
          )}
        </div>
      ))}
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

export default function Categories() {
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [parentId, setParentId] = useState<number | undefined>();
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
            <CategoryTree 
              categories={categories}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddChild={handleAddChild}
            />
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
    </div>
  );
}