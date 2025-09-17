interface CollegeHeaderProps {
  className?: string;
}

export function CollegeHeader({ className = "" }: CollegeHeaderProps) {
  return (
    <div className={`w-full bg-white border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="w-full">
          <img 
            src="/avs-college-header.png" 
            alt="AVS Engineering College"
            className="w-full h-auto max-h-32 object-contain mx-auto py-2"
            onError={(e) => {
              // Fallback to text if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'text-center py-4';
              fallback.innerHTML = `
                <h1 className="text-2xl font-bold text-blue-800">AVS Engineering College</h1>
                <p className="text-gray-600">Salem, Tamil Nadu</p>
              `;
              target.parentNode?.insertBefore(fallback, target.nextSibling);
            }}
          />
        </div>
      </div>
    </div>
  );
}
