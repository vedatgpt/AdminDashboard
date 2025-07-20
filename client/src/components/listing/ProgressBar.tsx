interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
      <div 
        className="bg-[#EC7830] h-2 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${progress}%` }}
      />
      <div className="flex justify-between mt-2 text-sm text-gray-600">
        <span>Adım {currentStep}/{totalSteps}</span>
        <span>{Math.round(progress)}% tamamlandı</span>
      </div>
    </div>
  );
}