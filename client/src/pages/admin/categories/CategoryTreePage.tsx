import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, List } from "lucide-react";
import type { CategoryWithChildren } from "@shared/schema";
import CategoryTreeView from "../../../components/CategoryTreeView";
import CategoryModal from "./CategoryModal";
import CategoryDetailModal from "./CategoryDetailModal";

export default function CategoryTreePage() {
  const queryClient = useQueryClient();
  
  // State management
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithChildren | undefined>();
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<CategoryWithChildren | undefined>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [parentIdForNew, setParentIdForNew] = useState<number | undefined>();

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

  // Event handlers
  const handleAddCategory = (parentId?: number) => {
    setSelectedCategory(undefined);
    setParentIdForNew(parentId);
    setShowModal(true);
  };

  const handleEditCategory = (category: CategoryWithChildren) => {
    setSelectedCategory(category);
    setParentIdForNew(undefined);
    setShowModal(true);
  };

  const handleDeleteCategory = (categoryId: number) => {
    deleteMutation.mutate(categoryId);
  };

  const handleViewDetails = (category: CategoryWithChildren) => {
    setSelectedCategoryDetail(category);
    setShowDetailModal(true);
  };

  const handleSelectCategory = (category: CategoryWithChildren) => {
    setSelectedCategoryId(category.id);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCategory(undefined);
    setParentIdForNew(undefined);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCategoryDetail(undefined);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kategori Yönetimi</h1>
            <p className="text-gray-600 text-sm mt-1">
              Ağaç görünümünde kategorileri yönetin ve düzenleyin
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/categories"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              Liste Görünümü
            </a>
            <button
              disabled
              className="px-4 py-2 bg-[#EC7830] text-white rounded-lg flex items-center gap-2 cursor-not-allowed opacity-75"
            >
              <LayoutGrid className="w-4 h-4" />
              Ağaç Görünümü
            </button>
          </div>
        </div>
      </div>

      {/* Tree View */}
      <CategoryTreeView
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        onViewDetails={handleViewDetails}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={handleSelectCategory}
      />

      {/* Modals */}
      <CategoryModal
        isOpen={showModal}
        onClose={handleCloseModal}
        category={selectedCategory}
        parentId={parentIdForNew}
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