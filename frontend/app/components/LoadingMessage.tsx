'use client';

export function LoadingMessage() {
  return (
    <div className="p-3 rounded-md border mb-2 bg-green-50 border-green-200">
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium">Assistant</div>
      </div>
      
      <div className="flex items-center">
        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-green-600 border-t-transparent mr-2"></div>
        <span className="text-sm text-green-700">Generating...</span>
      </div>
    </div>
  );
}