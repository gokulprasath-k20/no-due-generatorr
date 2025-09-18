interface CollegeHeaderProps {
  className?: string;
}

export function CollegeHeader({ className = "" }: CollegeHeaderProps) {
  return (
    <div className={`w-full bg-white border-b border-gray-200 shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Official AVS Engineering College Header */}
        <div className="flex items-center justify-center gap-6">
          {/* Left Logo - AVS Geometric Logo */}
          <div className="w-20 h-20 flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
              <div className="text-white font-bold text-xl tracking-wider">AVS</div>
            </div>
          </div>
          
          {/* College Name and Details */}
          <div className="text-center flex-grow">
            <div className="text-4xl font-bold text-blue-600 tracking-wide mb-1">
              AVS ENGINEERING COLLEGE
            </div>
            <div className="text-base text-gray-600 font-medium">
              Salem, Tamil Nadu
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Autonomous Institution
            </div>
          </div>
          
          {/* Right Logo - Institutional Logo */}
          <div className="w-20 h-20 flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg">
              <div className="text-white font-bold text-sm text-center leading-tight">
                INST<br/>LOGO
              </div>
            </div>
          </div>
        </div>
        
        {/* Department Header for IT */}
        <div className="text-center mt-4 pt-3 border-t border-gray-200">
          <div className="text-lg font-semibold text-gray-800">
            Department of Information Technology
          </div>
        </div>
      </div>
    </div>
  );
}
