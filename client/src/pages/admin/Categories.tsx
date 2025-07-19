import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Edit, Trash2, ChevronRight } from "lucide-react";
import type { Category, InsertCategory } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import CategoryForm from "@/components/admin/CategoryForm";
import Breadcrumbs from "@/components/admin/Breadcrumbs";

export default function Categories() {
  const [, navigate] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const queryClient = useQueryClient();

  // Get parent parameter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const parentId = urlParams.get('parent') === '0' || urlParams.get('parent') === null ? undefined : Number(urlParams.get('parent'));

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['/api/admin/categories', parentId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/categories?parent=${parentId || 0}`);
      return response.json();
    },
  });

  // Fetch breadcrumb path for current parent
  const { data: breadcrumbPath = [] } = useQuery({
    queryKey: ['/api/admin/categories', parentId, 'path'],
    queryFn: async () => {
      if (!parentId) return [];
      const response = await apiRequest('GET', `/api/admin/categories/${parentId}/path`);
      return response.json();
    },
    enabled: !!parentId,
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      const response = await apiRequest('POST', '/api/admin/categories', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      setShowForm(false);
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCategory> }) => {
      const response = await apiRequest('PATCH', `/api/admin/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      setEditingCategory(null);
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
    },
  });

  const handleCreateCategory = (data: InsertCategory) => {
    createMutation.mutate({
      ...data,
      parentId: parentId || null,
    });
  };

  const handleUpdateCategory = (data: Partial<InsertCategory>) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    }
  };

  const handleDeleteCategory = (category: Category) => {
    if (confirm(`"${category.name}" kategorisini silmek istediğinizden emin misiniz?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  const navigateToSubcategories = (categoryId: number) => {
    navigate(`/admin/categories?parent=${categoryId}`);
  };

  const navigateToParent = (categoryId?: number) => {
    if (categoryId) {
      navigate(`/admin/categories?parent=${categoryId}`);
    } else {
      navigate('/admin/categories');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-60 flex flex-col bg-white border border-gray-200 shadow-sm rounded-xl">
        <div className="flex flex-auto flex-col justify-center items-center p-4 md:p-5">
          <div className="flex justify-center">
            <div className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-[#EC7830] rounded-full" role="status" aria-label="loading">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with Breadcrumbs */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Breadcrumbs path={breadcrumbPath} onNavigate={navigateToParent} />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            {parentId ? `Alt Kategoriler` : 'Kategoriler'}
          </h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-x-2 py-2 px-3 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d96a2a] focus:outline-none focus:bg-[#d96a2a] disabled:opacity-50 disabled:pointer-events-none"
        >
          <Plus className="w-4 h-4" />
          Yeni Kategori
        </button>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Henüz kategori eklenmemiş</div>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-x-2 py-2 px-3 text-sm font-medium rounded-lg border border-transparent bg-[#EC7830] text-white hover:bg-[#d96a2a] focus:outline-none focus:bg-[#d96a2a]"
          >
            <Plus className="w-4 h-4" />
            İlk Kategoriyi Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category: Category) => (
            <div
              key={category.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="p-1 text-gray-400 hover:text-[#EC7830] transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {category.description && (
                <p className="text-sm text-gray-600 mb-3">{category.description}</p>
              )}
              <button
                onClick={() => navigateToSubcategories(category.id)}
                className="flex items-center gap-2 text-sm text-[#EC7830] hover:text-[#d96a2a] transition-colors"
              >
                Alt Kategoriler
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Category Form Modal */}
      {(showForm || editingCategory) && (
        <CategoryForm
          category={editingCategory}
          onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
          onCancel={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}