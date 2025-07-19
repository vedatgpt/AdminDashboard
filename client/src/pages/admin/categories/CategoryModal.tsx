import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Save } from "lucide-react";
import type { Category, InsertCategory } from "@shared/schema";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category;
  parentId?: number | null;
}

export default function CategoryModal({ 
  isOpen, 
  onClose, 
  category, 
  parentId 
}: CategoryModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: parentId || null,
    isActive: true,
    sortOrder: 0,
  });

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: category?.name || "",
        description: category?.description || "",
        parentId: parentId || category?.parentId || null,
        isActive: category?.isActive ?? true,
        sortOrder: category?.sortOrder || 0,
      });
    }
  }, [category, parentId, isOpen]);

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
      handleClose();
      alert("Kategori başarıyla oluşturuldu");
    },
    onError: (error) => {
      console.error('Create error:', error);
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
      handleClose();
      alert("Kategori başarıyla güncellendi");
    },
    onError: (error) => {
      console.error('Update error:', error);
      alert("Kategori güncellenirken hata oluştu");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert("Kategori adı gereklidir");
      return;
    }

    if (category) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      parentId: parentId || null,
      isActive: true,
      sortOrder: 0,
    });
    onClose();
  };

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {category ? "Kategori Düzenle" : "Yeni Kategori"}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
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
              disabled={isLoading}
              placeholder="Kategori adını girin"
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
              disabled={isLoading}
              placeholder="Kategori açıklaması (isteğe bağlı)"
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
              disabled={isLoading}
              min="0"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
              disabled={isLoading}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Kategori aktif
            </label>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#EC7830] text-white rounded-md hover:bg-[#d6691a] flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {category ? "Güncelleniyor..." : "Oluşturuluyor..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {category ? "Güncelle" : "Oluştur"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}