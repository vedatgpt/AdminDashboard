import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  FolderOpen, 
  Folder,
  MoreVertical,
  GripVertical
} from "lucide-react";
import type { CategoryWithChildren } from "@shared/schema";

interface CategoryTreeViewProps {
  onAddCategory: (parentId?: number) => void;
  onEditCategory: (category: CategoryWithChildren) => void;
  onDeleteCategory: (categoryId: number) => void;
  onViewDetails: (category: CategoryWithChildren) => void;
  selectedCategoryId?: number;
  onSelectCategory?: (category: CategoryWithChildren) => void;
}

interface TreeNodeProps {
  category: CategoryWithChildren;
  level: number;
  isExpanded: boolean;
  onToggle: (categoryId: number) => void;
  onAddCategory: (parentId?: number) => void;
  onEditCategory: (category: CategoryWithChildren) => void;
  onDeleteCategory: (categoryId: number) => void;
  onViewDetails: (category: CategoryWithChildren) => void;
  selectedCategoryId?: number;
  onSelectCategory?: (category: CategoryWithChildren) => void;
  draggedOver: boolean;
  onDragStart: (category: CategoryWithChildren) => void;
  onDragOver: (categoryId: number) => void;
  onDragLeave: () => void;
  onDrop: (targetCategoryId: number) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  category,
  level,
  isExpanded,
  onToggle,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onViewDetails,
  selectedCategoryId,
  onSelectCategory,
  draggedOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop
}) => {
  const [showActions, setShowActions] = useState(false);
  const [expandedChildren, setExpandedChildren] = useState<Set<number>>(new Set());
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedCategoryId === category.id;
  
  const handleToggle = () => {
    if (hasChildren) {
      onToggle(category.id);
    }
  };

  const handleSelect = () => {
    onSelectCategory?.(category);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    onDragStart(category);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDragOver(category.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(category.id);
  };

  return (
    <div>
      <div
        className={`
          group flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer
          border-l-2 transition-all duration-200
          ${isSelected ? 'bg-orange-50 border-l-[#EC7830]' : 'border-l-transparent'}
          ${draggedOver ? 'bg-blue-50 border-l-blue-500' : ''}
        `}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={onDragLeave}
        onDrop={handleDrop}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Drag Handle */}
        <div className="opacity-0 group-hover:opacity-50 mr-2 cursor-grab">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={handleToggle}
          className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>

        {/* Folder Icon */}
        <div className="mr-3">
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="w-5 h-5 text-orange-500" />
            ) : (
              <Folder className="w-5 h-5 text-orange-500" />
            )
          ) : (
            <div className="w-5 h-5 rounded bg-gray-300 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          )}
        </div>

        {/* Category Name */}
        <div className="flex-1 min-w-0" onClick={handleSelect}>
          <div className="flex items-center">
            <span className="font-medium text-gray-900 truncate">
              {category.name}
            </span>
            {!category.isActive && (
              <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                Pasif
              </span>
            )}
          </div>
          {category.description && (
            <p className="text-sm text-gray-500 truncate">
              {category.description}
            </p>
          )}
        </div>

        {/* Child Count */}
        {hasChildren && (
          <span className="mx-3 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {category.children.length}
          </span>
        )}

        {/* Action Buttons */}
        <div className={`
          flex items-center space-x-1 transition-opacity duration-200
          ${showActions ? 'opacity-100' : 'opacity-0'}
        `}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddCategory(category.id);
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Alt kategori ekle"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(category);
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Detayları görüntüle"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditCategory(category);
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Düzenle"
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`"${category.name}" kategorisini silmek istediğinizden emin misiniz?`)) {
                onDeleteCategory(category.id);
              }
            }}
            className="p-1 hover:bg-red-200 rounded transition-colors"
            title="Sil"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-0">
          {category.children.map((child) => (
            <TreeNode
              key={child.id}
              category={child}
              level={level + 1}
              isExpanded={expandedChildren.has(child.id)}
              onToggle={(childId) => {
                setExpandedChildren(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(childId)) {
                    newSet.delete(childId);
                  } else {
                    newSet.add(childId);
                  }
                  return newSet;
                });
                onToggle(childId);
              }}
              onAddCategory={onAddCategory}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
              onViewDetails={onViewDetails}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
              draggedOver={false}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function CategoryTreeView({
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onViewDetails,
  selectedCategoryId,
  onSelectCategory
}: CategoryTreeViewProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [draggedCategory, setDraggedCategory] = useState<CategoryWithChildren | null>(null);
  const [draggedOverCategory, setDraggedOverCategory] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch category tree
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ["/api/admin/categories"],
    queryFn: async (): Promise<CategoryWithChildren[]> => {
      const response = await fetch("/api/admin/categories");
      if (!response.ok) {
        throw new Error("Kategoriler yüklenemedi");
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Move category mutation
  const moveCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, newParentId }: { categoryId: number; newParentId: number | null }) => {
      const response = await fetch(`/api/admin/categories/${categoryId}/move`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parentId: newParentId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kategori taşınamadı");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
    },
    onError: (error: any) => {
      alert(error.message || "Kategori taşınırken hata oluştu");
    },
  });

  const handleToggle = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleDragStart = (category: CategoryWithChildren) => {
    setDraggedCategory(category);
  };

  const handleDragOver = (categoryId: number) => {
    setDraggedOverCategory(categoryId);
  };

  const handleDragLeave = () => {
    setDraggedOverCategory(null);
  };

  const handleDrop = (targetCategoryId: number) => {
    if (draggedCategory && draggedCategory.id !== targetCategoryId) {
      // Check if target is not a child of dragged category to prevent circular references
      const isTargetChild = (category: CategoryWithChildren, targetId: number): boolean => {
        if (category.id === targetId) return true;
        return category.children?.some(child => isTargetChild(child, targetId)) || false;
      };

      if (!isTargetChild(draggedCategory, targetCategoryId)) {
        moveCategoryMutation.mutate({
          categoryId: draggedCategory.id,
          newParentId: targetCategoryId,
        });
      } else {
        alert("Kategori kendi alt kategorisine taşınamaz");
      }
    }
    
    setDraggedCategory(null);
    setDraggedOverCategory(null);
  };

  // Auto-expand categories on first load
  useEffect(() => {
    if (categories && categories.length > 0) {
      const rootIds = categories.map(cat => cat.id);
      setExpandedCategories(new Set(rootIds));
    }
  }, [categories]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC7830] mx-auto"></div>
          <p className="mt-2 text-gray-600">Kategoriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-6 text-center">
          <p className="text-red-600">Kategoriler yüklenirken hata oluştu</p>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-6 text-center">
          <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Henüz kategori bulunmuyor
          </h3>
          <p className="text-gray-600 mb-4">
            İlk kategorinizi oluşturarak başlayın
          </p>
          <button
            onClick={() => onAddCategory()}
            className="px-4 py-2 bg-[#EC7830] text-white rounded-lg hover:bg-[#d6691a] transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            İlk Kategoriyi Oluştur
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Kategori Ağacı</h3>
          <button
            onClick={() => onAddCategory()}
            className="px-3 py-1 bg-[#EC7830] text-white text-sm rounded-md hover:bg-[#d6691a] transition-colors flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Kök Kategori Ekle
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Kategorileri sürükle-bırak ile yeniden düzenleyebilirsiniz
        </p>
      </div>

      {/* Tree Content */}
      <div className="max-h-[600px] overflow-y-auto">
        {categories.map((category) => (
          <TreeNode
            key={category.id}
            category={category}
            level={0}
            isExpanded={expandedCategories.has(category.id)}
            onToggle={handleToggle}
            onAddCategory={onAddCategory}
            onEditCategory={onEditCategory}
            onDeleteCategory={onDeleteCategory}
            onViewDetails={onViewDetails}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={onSelectCategory}
            draggedOver={draggedOverCategory === category.id}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}