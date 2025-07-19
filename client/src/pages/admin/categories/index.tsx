import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Plus, Tags } from "lucide-react";
import type { Category } from "@shared/schema";
import CategoryList from "./CategoryList";
import CategoryModal from "./CategoryModal";
import CategoryDetailModal from "./CategoryDetailModal";
import Breadcrumbs from "./Breadcrumbs";

export default function Categories() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();

  // Parse URL parameters
  const params = new URLSearchParams(search);
  const parentId = params.get("parent") ? parseInt(params.get("parent")!) : null;
  const page = parseInt(params.get("page") || "1");

  // State management
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<Category | undefined>();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
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

  // Navigation functions
  const navigateToParent = (newParentId: number | null) => {
    const newParams = new URLSearchParams();
    if (newParentId) {
      newParams.set("parent", newParentId.toString());
    }
    newParams.set("page", "1"); // Reset to first page
    setLocation(`/admin/categories?${newParams.toString()}`);
  };

  const navigateToPage = (newPage: number) => {
    const newParams = new URLSearchParams();
    if (parentId) {
      newParams.set("parent", parentId.toString());
    }
    newParams.set("page", newPage.toString());
    setLocation(`/admin/categories?${newParams.toString()}`);
  };

  // Event handlers
  const handleAdd = () => {
    setSelectedCategory(undefined);
    setShowModal(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetail = (category: Category) => {
    setSelectedCategoryDetail(category);
    setShowDetailModal(true);
  };

  const handleViewSubcategories = (category: Category) => {
    navigateToParent(category.id);
  };

  const handlePageChange = (newPage: number) => {
    navigateToPage(newPage);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCategory(undefined);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCategoryDetail(undefined);
  };

  return (
    <div>
      {/* Page Header - consistent with other admin pages */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kategoriler</h1>
            <p className="text-gray-600 text-sm mt-1">
              {parentId 
                ? "Alt kategorileri yönetin ve düzenleyin" 
                : "Kategorileri yönetin ve düzenleyin"
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/categories/tree"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Tags className="w-4 h-4" />
              Ağaç Görünümü
            </a>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-[#EC7830] text-white rounded-lg hover:bg-[#d6691a] transition-colors flex items-center gap-2"
              disabled={deleteMutation.isPending}
            >
              <Plus className="w-4 h-4" />
              {parentId ? "Alt Kategori Ekle" : "Yeni Kategori"}
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <Breadcrumbs 
        parentId={parentId} 
        onNavigate={navigateToParent} 
      />

      {/* Category List */}
      <CategoryList
        parentId={parentId}
        page={page}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetail={handleViewDetail}
        onViewSubcategories={handleViewSubcategories}
        onPageChange={handlePageChange}
      />

      {/* Modals */}
      <CategoryModal
        isOpen={showModal}
        onClose={handleCloseModal}
        category={selectedCategory}
        parentId={parentId}
      />

      {selectedCategoryDetail && (
        <CategoryDetailModal
          isOpen={showDetailModal}
          onClose={handleCloseDetailModal}
          category={selectedCategoryDetail}
        />
      )}
    </div>
  );
}