interface CollegeHeaderProps {
  className?: string;
}

export function CollegeHeader({ className = "" }: CollegeHeaderProps) {
  return (
    <div className={`w-full bg-white border-b border-gray-200 shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
        {/* Official AVS Engineering College Header */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6">
          {/* Left Logo - AVS Geometric Logo */}
          <div className="w-12 h-12 sm:w-16 md:w-20 sm:h-16 md:h-20 flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
              <div className="text-white font-bold text-sm sm:text-lg md:text-xl tracking-wider">AVS</div>
            </div>
          </div>
          
          {/* College Name and Details */}
          <div className="text-center flex-grow min-w-0">
            <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600 tracking-wide mb-1 leading-tight">
              <span className="block sm:inline">AVS ENGINEERING</span>
              <span className="block sm:inline sm:ml-2">COLLEGE</span>
            </div>
            <div className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
              Salem, Tamil Nadu
            </div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">
              Autonomous Institution
            </div>
          </div>
          
          {/* Right Logo - Institutional Logo */}
          <div className="w-12 h-12 sm:w-16 md:w-20 sm:h-16 md:h-20 flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg">
              <div className="text-white font-bold text-xs sm:text-sm text-center leading-tight">
                INST<br/>LOGO
              </div>
            </div>
          </div>
        </div>
        
        {/* Department Header for IT */}
        <div className="text-center mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-200">
          <div className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">
            Department of Information Technology
          </div>
        </div>
      </div>
    </div>
  );
}
