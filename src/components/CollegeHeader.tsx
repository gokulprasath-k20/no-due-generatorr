interface CollegeHeaderProps {
  className?: string;
}

export function CollegeHeader({ className = "" }: CollegeHeaderProps) {
  return (
    <div className={`w-full bg-white border-b border-gray-200 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 py-4">
        <img 
          src="/college-header.jpg" 
          alt="College Header" 
          className="w-full max-w-6xl mx-auto h-auto object-cover rounded-lg shadow-md"
        />
      </div>
    </div>
  );
}
