import { Category } from '@shared/schema';

interface CategoryCardProps {
  category: Category;
  onClick: () => void;
  hasSubcategories?: boolean;
  onHover?: (category: Category) => void;
}

export default function CategoryCard({ category, onClick, hasSubcategories, onHover }: CategoryCardProps) {
  const iconUrl = category.icon 
    ? `${window.location.origin}/uploads/category-icons/${category.icon}`
    : null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover?.(category)}
      className="w-full p-6 bg-white border border-gray-200 rounded-xl hover:border-[#EC7830] hover:shadow-md transition-all duration-200 text-left group"
    >
      <div className="flex items-center space-x-4">
        {iconUrl && (
          <div className="flex-shrink-0">
            <img 
              src={iconUrl} 
              alt={category.name}
              className="w-12 h-12 object-contain"
              loading="eager"
              decoding="sync"
              crossOrigin="anonymous"
              style={{ 
                imageRendering: 'auto',
                objectFit: 'contain',
                maxWidth: '100%',
                height: 'auto'
              }}
              onLoad={() => {
                console.log(`📷 CategoryCard icon loaded from cache: ${category.name}`);
              }}
              onError={(e) => {
                console.log(`❌ CategoryCard icon failed: ${category.name}`);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 group-hover:text-[#EC7830] transition-colors">
            {category.name}
          </h3>
          
          {category.description && (
            <p className="text-sm text-gray-500 mt-1 truncate">
              {category.description}
            </p>
          )}
          
          {hasSubcategories && (
            <div className="flex items-center mt-2 text-xs text-gray-400">
              <span>Alt kategorilere göz atın</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
        
        {!hasSubcategories && (
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}