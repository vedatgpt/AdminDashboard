import { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Edit, Trash2, FolderOpen, Folder } from "lucide-react";
import type { Category } from "@shared/schema";

interface CategoryTreeProps {
  categories: Category[];
  onSelect?: (category: Category) => void;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  onAddChild?: (parentCategory: Category) => void;
  selectedId?: number;
  level?: number;
}

interface CategoryNodeProps {
  category: Category & { children?: Category[] };
  onSelect?: (category: Category) => void;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  onAddChild?: (parentCategory: Category) => void;
  selectedId?: number;
  level: number;
}

function CategoryNode({ 
  category, 
  onSelect, 
  onEdit, 
  onDelete, 
  onAddChild, 
  selectedId, 
  level 
}: CategoryNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedId === category.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    onSelect?.(category);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(category);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(category);
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddChild?.(category);
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-2 px-2 lg:px-3 rounded-lg cursor-pointer transition-colors ${
          isSelected 
            ? "bg-[#EC7830] text-white" 
            : "hover:bg-gray-50 text-gray-800"
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Expand/Collapse button */}
        <button
          onClick={handleToggle}
          className="w-4 h-4 mr-2 flex items-center justify-center text-gray-400 hover:text-gray-600"
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>

        {/* Category icon */}
        <div className="w-5 h-5 mr-3 flex items-center justify-center">
          {hasChildren ? (
            isExpanded ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />
          ) : (
            <div className="w-5 h-5 bg-gray-300 rounded-sm" />
          )}
        </div>

        {/* Category info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-xs lg:text-sm truncate">{category.name}</h3>
              {category.description && (
                <p className={`text-xs truncate mt-1 hidden sm:block ${
                  isSelected ? "text-orange-100" : "text-gray-500"
                }`}>
                  {category.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-1 ml-2">
              <span className={`text-xs px-1 lg:px-2 py-1 rounded ${
                isSelected 
                  ? "bg-orange-100 text-orange-800" 
                  : "bg-gray-100 text-gray-600"
              }`}>
                {category.adCount || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={handleAddChild}
            className={`p-1 rounded hover:bg-gray-200 ${
              isSelected ? "text-white hover:bg-orange-600" : "text-gray-500"
            }`}
            title="Alt kategori ekle"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={handleEdit}
            className={`p-1 rounded hover:bg-gray-200 ${
              isSelected ? "text-white hover:bg-orange-600" : "text-gray-500"
            }`}
            title="Düzenle"
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            className={`p-1 rounded hover:bg-red-200 ${
              isSelected ? "text-white hover:bg-red-600" : "text-gray-500 hover:text-red-600"
            }`}
            title="Sil"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-2">
          {category.children!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              selectedId={selectedId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryTree({ 
  categories, 
  onSelect, 
  onEdit, 
  onDelete, 
  onAddChild, 
  selectedId,
  level = 0 
}: CategoryTreeProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Henüz kategori bulunmuyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 group">
      {categories.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          selectedId={selectedId}
          level={level}
        />
      ))}
    </div>
  );
}