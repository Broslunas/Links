import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12 sm:h-14 sm:w-14',
    xl: 'h-16 w-16 sm:h-20 sm:w-20',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-sm sm:text-base',
    xl: 'text-base sm:text-lg',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
      <div className="relative">
        {/* Main spinner */}
        <svg
          className={cn(
            'animate-spin text-primary transition-all duration-300',
            sizeClasses[size],
            className
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-label="Loading"
          role="img"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>

        {/* Subtle pulse ring for enhanced visual feedback */}
        <div className={cn(
          'absolute inset-0 rounded-full animate-ping opacity-20',
          'bg-primary',
          size === 'lg' || size === 'xl' ? 'block' : 'hidden'
        )} />
      </div>

      {text && (
        <p className={cn(
          'text-muted-foreground font-medium leading-relaxed text-center',
          textSizeClasses[size],
          // Enhanced contrast for accessibility
          'contrast-more:text-foreground contrast-more:font-semibold',
          // Subtle animation
          'animate-pulse'
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

export { LoadingSpinner };