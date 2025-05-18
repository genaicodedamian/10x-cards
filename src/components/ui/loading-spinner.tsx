import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility is available as per Shadcn/ui setup

export interface LoadingSpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  size = 24, // Default size
  ...props
}) => {
  return (
    <Loader2
      className={cn('animate-spin', className)}
      width={size}
      height={size}
      {...props}
    />
  );
};

export { LoadingSpinner }; 