import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-12">
      <Icon className="w-16 h-16 text-gray-300 mb-4" />
      <p className="text-lg font-medium text-gray-900 mb-2">{title}</p>
      <p className="text-gray-500">{description}</p>
    </div>
  );
}
