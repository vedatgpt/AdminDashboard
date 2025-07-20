import { Category } from '@shared/schema';

interface BreadcrumbNavProps {
  categoryPath: Category[];
  onCategoryClick: (category: Category | null, index: number) => void;
}

export default function BreadcrumbNav({ categoryPath, onCategoryClick }: BreadcrumbNavProps) {
  if (categoryPath.length === 0) {
    return (
      <nav className="mb-6">
        <span className="text-gray-600 text-sm">Ana Kategoriler</span>
      </nav>
    );
  }

  return (
    <nav className="mb-6" aria-label="Breadcrumb">
      <div className="flex items-center space-x-2 text-sm">
        <button
          onClick={() => onCategoryClick(null, -1)}
          className="text-[#EC7830] hover:text-[#d6691a] transition-colors"
        >
          Ana Kategoriler
        </button>
        
        {categoryPath.map((category, index) => (
          <div key={category.id} className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            
            {index === categoryPath.length - 1 ? (
              <span className="text-gray-900 font-medium">{category.name}</span>
            ) : (
              <button
                onClick={() => onCategoryClick(category, index)}
                className="text-[#EC7830] hover:text-[#d6691a] transition-colors"
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