'use client';

type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
};

export function LoadingSpinner({ size = 'md', color = 'current' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
  };

  // Use inline style for dynamic color to avoid Tailwind purge issues
  const style = color !== 'current' ? { 
    borderColor: color,
    borderTopColor: 'transparent',
    color: color
  } : undefined;

  return (
    <div 
      className={`inline-block ${sizeClasses[size]} animate-spin rounded-full border-2 border-solid border-current border-t-transparent`} 
      style={style}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}