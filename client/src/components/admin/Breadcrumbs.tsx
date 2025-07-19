import { ChevronRight } from "lucide-react";
import type { Category } from "@shared/schema";

interface BreadcrumbsProps {
  path: Category[];
  onNavigate: (categoryId?: number) => void;
}

export default function Breadcrumbs({ path, onNavigate }: BreadcrumbsProps) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {/* Home/Root */}
        <li className="inline-flex items-center">
          <button
            onClick={() => onNavigate()}
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-[#EC7830] transition-colors"
          >
            Ana Kategoriler
          </button>
        </li>

        {/* Path items */}
        {path.map((category, index) => (
          <li key={category.id}>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
              <button
                onClick={() => onNavigate(category.id)}
                className={`text-sm font-medium transition-colors ${
                  index === path.length - 1
                    ? 'text-gray-500 cursor-default'
                    : 'text-gray-700 hover:text-[#EC7830]'
                }`}
                disabled={index === path.length - 1}
              >
                {category.name}
              </button>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}