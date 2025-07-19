import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Edit2, Trash2, FolderOpen, Settings, Eye, Folder,
  GripVertical
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Category } from "@shared/schema";

interface CategoryListProps {
  parentId: number | null;
  page: number;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  onViewDetail: (category: Category) => void;
  onViewSubcategories: (category: Category) => void;
  onPageChange: (page: number) => void;
}

// Sortable Category Item Component
function SortableCategoryItem({ 
  category, 
  onEdit, 
  onDelete, 
  onViewDetail, 
  onViewSubcategories 
}: {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-white ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between p-4 hover:bg-gray-50">
        <div className="flex items-center gap-3">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab hover:text-[#EC7830]"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-[#EC7830]" />
            <div>
              <h3 className="font-medium text-gray-900">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-gray-500">{category.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <span className={`px-2 py-1 text-xs rounded-full ${
              category.isActive 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {category.isActive ? 'Aktif' : 'Pasif'}
            </span>
            <span className="text-xs text-gray-500">Sıra: {category.sortOrder}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewSubcategories(category)}
            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
            title="Alt kategorileri görüntüle"
          >
            <Folder className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onViewDetail(category)}
            className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"
            title="Özel alanları yönet"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-gray-400 hover:text-[#EC7830] rounded-lg hover:bg-orange-50"
            title="Düzenle"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onDelete(category.id)}
            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
            title="Sil"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CategoryList({
  parentId,
  page,
  onEdit,
  onDelete,
  onViewDetail,
  onViewSubcategories,
  onPageChange
}: CategoryListProps) {
  const queryClient = useQueryClient();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch paginated categories
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/categories", "paginated", { parentId, page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(parentId && { parent: parentId.toString() })
      });
      
      const response = await fetch(`/api/admin/categories/paginated?${params}`);
      if (!response.ok) throw new Error("Kategoriler alınamadı");
      return response.json();
    },
  });

  const categories = data?.categories || [];
  const totalPages = data?.totalPages || 1;

  // Drag and drop mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ activeId, overId }: { activeId: number; overId: number }) => {
      const response = await fetch(`/api/admin/categories/${activeId}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: overId }),
      });
      if (!response.ok) throw new Error("Sıralama güncellenemedi");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((cat: Category) => cat.id === active.id);
    const newIndex = categories.findIndex((cat: Category) => cat.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // Optimistic update
      const newCategories = arrayMove(categories, oldIndex, newIndex);
      queryClient.setQueryData(
        ["/api/admin/categories", "paginated", { parentId, page }],
        (old: any) => ({
          ...old,
          categories: newCategories
        })
      );

      reorderMutation.mutate({ activeId: active.id, overId: over.id });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-500">Kategoriler yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="flex items-center justify-center p-8">
          <div className="text-red-500">Kategoriler yüklenirken hata oluştu</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      {categories.length > 0 ? (
        <>
          <div className="p-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={categories.map((cat: Category) => cat.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {categories.map((category: Category) => (
                    <SortableCategoryItem
                      key={category.id}
                      category={category}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onViewDetail={onViewDetail}
                      onViewSubcategories={onViewSubcategories}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t p-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Sayfa {page} / {totalPages}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onPageChange(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Önceki
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`px-3 py-2 text-sm border rounded-lg ${
                        page === pageNum 
                          ? 'bg-[#EC7830] text-white border-[#EC7830]' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => onPageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-8 text-center text-gray-500">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            {parentId ? "Alt kategori yok" : "Henüz kategori yok"}
          </p>
          <p className="text-gray-500">
            {parentId ? "Bu kategoriye alt kategori eklemek için yukarıdaki butonu kullanın." : "İlk ana kategoriyi oluşturmak için yukarıdaki butonu kullanın."}
          </p>
        </div>
      )}
    </div>
  );
}