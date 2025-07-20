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
    <nav>
      <div className="flex items-center space-x-1 text-xs lg:text-sm flex-wrap">
        {/* Only first category (root) is clickable */}
        {categoryPath.length > 0 && (
          <>
            <button
              onClick={() => onCategoryClick(null, -1)}
              className="text-blue-600 hover:underline truncate max-w-[60px] lg:max-w-none"
              title={categoryPath[0].name}
            >
              {categoryPath[0].name}
            </button>
            
            {categoryPath.slice(1).map((category, index) => (
              <div key={category.id} className="flex items-center space-x-1">
                <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400 flex-shrink-0" />
                <span 
                  className="text-gray-700 truncate max-w-[60px] lg:max-w-none"
                  title={category.name}
                >
                  {category.name}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </nav>
  );
}