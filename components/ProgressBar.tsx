import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const progressPercentage = Math.round(Math.min(100, Math.max(0, progress)));

  return (
    <div className="w-full bg-gray-200 rounded-full h-5 dark:bg-gray-700 overflow-hidden relative">
      <div 
        className="bg-brand-primary h-5 rounded-full transition-all duration-300 ease-linear" 
        style={{ width: `${progressPercentage}%` }}
        role="progressbar"
        aria-valuenow={progressPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
      </div>
       <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white mix-blend-difference">
        {progressPercentage}%
      </span>
    </div>
  );
};

export default ProgressBar;
