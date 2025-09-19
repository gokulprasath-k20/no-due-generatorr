interface CollegeHeaderProps {
  className?: string;
}

export function CollegeHeader({ className = "" }: CollegeHeaderProps) {
  return (
    <div className={`w-full bg-background border-b border-border shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
        {/* Official AVS Engineering College Header */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 md:gap-6">
          {/* Left Logo - AVSEC Salem Logo */}
          <div className="w-16 h-16 sm:w-20 md:w-24 sm:h-20 md:h-24 flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg border-2 border-orange-300">
              <div className="text-center">
                <div className="text-white font-bold text-xs sm:text-sm md:text-base leading-tight">
                  <div className="border-2 border-white rounded p-1">
                    <div className="text-[8px] sm:text-[10px] md:text-xs">AVSEC</div>
                    <div className="text-[6px] sm:text-[8px] md:text-[10px]">Salem</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* College Name and Details */}
          <div className="text-center flex-grow min-w-0">
            <div className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-wide mb-1 leading-tight">
              <span className="block sm:inline">AVS</span>
              <span className="block sm:inline sm:ml-2">ENGINEERING</span>
              <span className="block sm:inline sm:ml-2">COLLEGE</span>
            </div>
            <div className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium mt-1">
              (Autonomous Status - Conferred by UGC)
            </div>
          </div>
          
          {/* Right Logo - NAAC Accreditation Badge */}
          <div className="w-16 h-16 sm:w-20 md:w-24 sm:h-20 md:h-24 flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-400 relative">
              {/* NAAC Badge Design */}
              <div className="text-center text-white">
                <div className="text-lg sm:text-xl md:text-2xl font-bold bg-yellow-500 text-red-800 rounded-full w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center mx-auto mb-1">
                  A
                </div>
                <div className="text-[6px] sm:text-[8px] md:text-[10px] font-bold leading-tight">
                  <div>NAAC</div>
                </div>
              </div>
              {/* Ribbon */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-red-700 text-yellow-300 text-[6px] sm:text-[8px] px-1 rounded-t font-bold">
                1st cycle
              </div>
            </div>
          </div>
        </div>
        
        {/* Department Header for IT */}
        <div className="text-center mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-border">
          <div className="text-sm sm:text-base md:text-lg font-semibold text-foreground">
            Department of Information Technology
          </div>
        </div>
      </div>
    </div>
  );
}
