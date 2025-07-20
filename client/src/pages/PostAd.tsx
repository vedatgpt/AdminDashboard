import { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useCustomFields } from "@/hooks/useCustomFields";
import { Link } from "wouter";
import type { Category, CategoryCustomField } from "@shared/schema";

interface CategoryStep {
  category: Category;
  level: number;
}

export default function PostAd() {
  const [selectedPath, setSelectedPath] = useState<CategoryStep[]>([]);
  const [finalCategory, setFinalCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({
    title: "",
    description: "",
    price: "",
  });

  const { data: allCategories = [] } = useCategories();
  const { data: customFields = [] } = useCustomFields(finalCategory?.id);

  // Get current level categories
  const getCurrentLevelCategories = (): Category[] => {
    if (selectedPath.length === 0) {
      // Root level categories
      return allCategories.filter(cat => !cat.parentId);
    }
    
    const currentParent = selectedPath[selectedPath.length - 1].category;
    return allCategories.filter(cat => cat.parentId === currentParent.id);
  };

  // Check if category has children
  const hasChildren = (categoryId: number): boolean => {
    return allCategories.some(cat => cat.parentId === categoryId);
  };

  // Handle category selection
  const handleCategorySelect = (category: Category) => {
    const newStep: CategoryStep = {
      category,
      level: selectedPath.length
    };

    const newPath = [...selectedPath, newStep];
    setSelectedPath(newPath);

    // If this category has no children, it's the final category
    if (!hasChildren(category.id)) {
      setFinalCategory(category);
    } else {
      setFinalCategory(null);
    }
  };

  // Go back to previous level
  const goBackToLevel = (level: number) => {
    const newPath = selectedPath.slice(0, level);
    setSelectedPath(newPath);
    setFinalCategory(null);
  };

  // Handle custom field input changes
  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Render custom field input based on type
  const renderCustomField = (field: CategoryCustomField) => {
    const value = formData[field.fieldName] || "";

    switch (field.fieldType) {
      case "text":
        return (
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
          />
        );

      case "select":
        const options = field.options ? JSON.parse(field.options) : [];
        return (
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
          >
            <option value="">{field.placeholder || "Seçiniz"}</option>
            {options.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "number_range":
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Min"
              value={value.min || ""}
              onChange={(e) => handleCustomFieldChange(field.fieldName, {
                ...value,
                min: e.target.value
              })}
            />
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Max"
              value={value.max || ""}
              onChange={(e) => handleCustomFieldChange(field.fieldName, {
                ...value,
                max: e.target.value
              })}
            />
          </div>
        );

      case "checkbox":
        const checkboxOptions = field.options ? JSON.parse(field.options) : [];
        return (
          <div className="space-y-2">
            {checkboxOptions.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${field.fieldName}-${index}`}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  checked={(value || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = value || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v: string) => v !== option);
                    handleCustomFieldChange(field.fieldName, newValues);
                  }}
                />
                <label htmlFor={`${field.fieldName}-${index}`} className="text-sm font-medium">
                  {option}
                </label>
              </div>
            ))}
          </div>
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.fieldName}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              checked={value || false}
              onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.checked)}
            />
            <label htmlFor={field.fieldName} className="text-sm font-medium">
              {field.label}
            </label>
          </div>
        );

      default:
        return (
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
          />
        );
    }
  };

  // Handle form submission (temporary - just log data)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Ad Data:", {
      category: finalCategory,
      categoryPath: selectedPath.map(s => s.category.name).join(" > "),
      formData,
      customFields: formData
    });
    alert("İlan verisi konsola yazıldı! (Geçici test)");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <button className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center">
              ← Ana Sayfa
            </button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            İlan Ver (Test Sayfası)
          </h1>
          <p className="text-gray-600 mt-2">
            Bu sayfa kategori ve özel alanların test edilmesi için geçici olarak oluşturulmuştur.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Selection */}
          <div className="lg:col-span-2 bg-white rounded-lg border shadow-sm">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">1. Kategori Seçimi</h2>
              {selectedPath.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                  <span>Seçilen:</span>
                  {selectedPath.map((step, index) => (
                    <div key={index} className="flex items-center">
                      <button
                        onClick={() => goBackToLevel(index)}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {step.category.name}
                      </button>
                      {index < selectedPath.length - 1 && (
                        <span className="mx-1">→</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getCurrentLevelCategories().map((category) => (
                  <button
                    key={category.id}
                    className="p-4 text-left border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    onClick={() => handleCategorySelect(category)}
                  >
                    <div>
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {category.description}
                        </div>
                      )}
                    </div>
                    {hasChildren(category.id) && (
                      <span className="float-right">→</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">2. İlan Detayları</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Fields */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Başlık *
                  </label>
                  <input
                    id="title"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="İlan başlığı"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    id="description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="İlan açıklaması"
                    rows={3}
                  />
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Fiyat
                  </label>
                  <input
                    id="price"
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Fiyat (TL)"
                  />
                </div>

                {/* Custom Fields */}
                {finalCategory && customFields.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-4">Kategori Özel Alanları</h3>
                    <div className="space-y-4">
                      {customFields.map((field) => (
                        <div key={field.id}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {renderCustomField(field)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                    finalCategory 
                      ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!finalCategory}
                >
                  {finalCategory ? "Test Et (Konsola Yaz)" : "Önce kategori seçin"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}