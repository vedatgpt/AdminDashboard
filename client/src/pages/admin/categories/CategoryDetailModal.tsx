import React, { useState } from "react";
import { X, Type, Filter, SortAsc } from "lucide-react";
import type { Category } from "@shared/schema";
import CustomFieldManager from "./CustomFieldManager";
import FilterManager from "./FilterManager";

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
}

type TabType = 'fields' | 'filters';

export default function CategoryDetailModal({ 
  isOpen, 
  onClose, 
  category 
}: CategoryDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('fields');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {category.name} - Detaylar
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {category.description || "Bu kategoriye ait detayları yönetin"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b flex-shrink-0 bg-gray-50">
          <button
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'fields'
                ? 'border-[#EC7830] text-[#EC7830] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('fields')}
          >
            <Type className="w-4 h-4 inline-block mr-2" />
            Özel Alanlar
          </button>
          <button
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'filters'
                ? 'border-[#EC7830] text-[#EC7830] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('filters')}
          >
            <Filter className="w-4 h-4 inline-block mr-2" />
            Filtreler & Sıralama
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeTab === 'fields' && (
              <CustomFieldManager 
                categoryId={category.id} 
                categoryName={category.name}
              />
            )}
            
            {activeTab === 'filters' && (
              <FilterManager 
                categoryId={category.id} 
                categoryName={category.name}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}