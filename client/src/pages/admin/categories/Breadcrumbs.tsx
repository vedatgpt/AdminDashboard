import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  id: number;
  name: string;
}

interface BreadcrumbsProps {
  parentId: number | null;
  onNavigate: (parentId: number | null) => void;
}

export default function Breadcrumbs({ parentId, onNavigate }: BreadcrumbsProps) {
  const { data: breadcrumbs = [] } = useQuery({
    queryKey: ["/api/admin/categories", parentId, "breadcrumbs"],
    queryFn: async (): Promise<BreadcrumbItem[]> => {
      if (!parentId) return [];
      
      const response = await fetch(`/api/admin/categories/${parentId}/breadcrumbs`);
      if (!response.ok) throw new Error("Breadcrumbs alınamadı");
      return response.json();
    },
    enabled: !!parentId,
  });

  if (!parentId || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border p-4 mb-6">
      <nav className="flex items-center text-sm text-gray-600">
        <button
          onClick={() => onNavigate(null)}
          className="flex items-center hover:text-[#EC7830] transition-colors"
        >
          <Home className="w-4 h-4 mr-1" />
          Ana Kategoriler
        </button>
        
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={breadcrumb.id} className="flex items-center">
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            {index === breadcrumbs.length - 1 ? (
              <span className="text-[#EC7830] font-medium">
                {breadcrumb.name}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(breadcrumb.id)}
                className="hover:text-[#EC7830] transition-colors"
              >
                {breadcrumb.name}
              </button>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}