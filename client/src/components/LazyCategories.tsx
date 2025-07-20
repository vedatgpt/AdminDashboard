import React, { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import type { Category } from "@shared/schema";

interface LazyCategoriesProps {
  onCategorySelect: (category: Category) => void;
  selectedPath: Category[];
}

export default function LazyCategories({ onCategorySelect, selectedPath }: LazyCategoriesProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [loadingChildren, setLoadingChildren] = useState<Set<number>>(new Set());
  const [categoryChildren, setCategoryChildren] = useState<Map<number | null, Category[]>>(new Map());

  // Load child categories for a parent
  const loadChildren = async (parentId: number | null) => {
    if (loadingChildren.has(parentId || 0)) return;
    
    setLoadingChildren(prev => new Set(prev).add(parentId || 0));
    
    try {
      const response = await fetch(`/api/categories/children?parentId=${parentId || ''}`);
      if (response.ok) {
        const children = await response.json();
        setCategoryChildren(prev => new Map(prev).set(parentId, children));
      }
    } catch (error) {
      console.error('Error loading category children:', error);
    } finally {
      setLoadingChildren(prev => {
        const newSet = new Set(prev);
        newSet.delete(parentId || 0);
        return newSet;
      });
    }
  };

  // Load root categories on mount
  React.useEffect(() => {
    loadChildren(null);
  }, []);

  // Toggle category expansion
  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
      // Load children if not already loaded
      if (!categoryChildren.has(categoryId)) {
        loadChildren(categoryId);
      }
    }
    setExpandedCategories(newExpanded);
  };

  // Render category item
  const renderCategory = (category: Category, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedPath.some(cat => cat.id === category.id);
    const children = categoryChildren.get(category.id) || [];
    const hasChildren = children.length > 0;
    const isLoading = loadingChildren.has(category.id);

    return (
      <div key={category.id} className="select-none">
        <div
          className={`
            flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-md
            ${isSelected ? 'bg-orange-50 border-l-4 border-orange-500' : ''}
          `}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          {/* Expand/Collapse button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCategory(category.id);
            }}
            className="mr-2 p-1 hover:bg-gray-200 rounded"
            disabled={!hasChildren && !isLoading}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            ) : hasChildren ? (
              isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          {/* Category icon */}
          <div className="mr-2">
            {isExpanded ? <FolderOpen size={16} className="text-orange-500" /> : <Folder size={16} className="text-gray-400" />}
          </div>

          {/* Category name */}
          <button
            onClick={() => onCategorySelect(category)}
            className="flex-1 text-left hover:text-orange-600"
          >
            {category.name}
            {children.length > 0 && (
              <span className="text-gray-500 text-sm ml-1">({children.length})</span>
            )}
          </button>
        </div>

        {/* Children */}
        {isExpanded && children.length > 0 && (
          <div className="ml-4">
            {children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootCategories = categoryChildren.get(null) || [];

  return (
    <div className="max-h-96 overflow-y-auto border rounded-lg bg-white">
      <div className="p-2">
        <div className="text-sm font-medium text-gray-700 mb-2">Kategoriler</div>
        {rootCategories.length === 0 && !loadingChildren.has(0) ? (
          <div className="text-gray-500 text-sm p-4">Kategori bulunamadı</div>
        ) : (
          rootCategories.map(category => renderCategory(category))
        )}
        {loadingChildren.has(0) && (
          <div className="flex items-center justify-center p-4">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}