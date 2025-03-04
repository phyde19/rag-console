'use client';

export function LoadingSpinner() {
  return (
    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-t-transparent text-[var(--button-text)]" role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
}