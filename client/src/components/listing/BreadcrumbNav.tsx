import { Category } from '@shared/schema';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbNavProps {
  categoryPath: Category[];
  onCategoryClick: (category: Category | null, index: number) => void;
}

export default function BreadcrumbNav({ categoryPath, onCategoryClick }: BreadcrumbNavProps) {
  if (categoryPath.length === 0) {
    return null; // Don't show breadcrumb for main categories
  }

  return (
    <nav className="mb-4">
      <div className="flex items-center space-x-1 text-sm text-blue-600">
        <button
          onClick={() => onCategoryClick(null, -1)}
          className="hover:underline"
        >
          Kategoriler
        </button>
        
        {categoryPath.map((category, index) => (
          <div key={category.id} className="flex items-center space-x-1">
            <ChevronRight className="w-4 h-4 text-gray-400" />
            
            {index === categoryPath.length - 1 ? (
              <span className="text-gray-700 font-medium">{category.name}</span>
            ) : (
              <button
                onClick={() => onCategoryClick(category, index)}
                className="hover:underline"
              >
                {category.name}
              </button>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}