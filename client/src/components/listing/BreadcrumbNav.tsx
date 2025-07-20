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
      <div className="flex items-center space-x-1 text-sm">
        {/* Only first category (root) is clickable */}
        {categoryPath.length > 0 && (
          <>
            <button
              onClick={() => onCategoryClick(null, -1)}
              className="text-blue-600 hover:underline"
            >
              {categoryPath[0].name}
            </button>
            
            {categoryPath.slice(1).map((category, index) => (
              <div key={category.id} className="flex items-center space-x-1">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{category.name}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </nav>
  );
}