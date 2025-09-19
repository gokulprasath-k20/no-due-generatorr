interface CollegeHeaderProps {
  className?: string;
}

export function CollegeHeader({ className = "" }: CollegeHeaderProps) {
  return (
    <div className={`w-full bg-background border-b border-border shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        {/* Official AVS Engineering College Header */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 md:gap-6">
          {/* Left Logo - AVSEC Salem Logo */}
          <div className="w-12 h-12 sm:w-16 md:w-20 lg:w-24 sm:h-16 md:h-20 lg:h-24 flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg border-2 border-orange-300">
              <div className="text-center">
                <div className="text-white font-bold text-xs sm:text-sm md:text-base leading-tight">
                  <div className="border-2 border-white rounded p-0.5 sm:p-1">
                    <div className="text-[7px] sm:text-[8px] md:text-[10px] lg:text-xs">AVSEC</div>
                    <div className="text-[5px] sm:text-[6px] md:text-[8px] lg:text-[10px]">Salem</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* College Name and Details */}
          <div className="text-center flex-grow min-w-0 px-1">
            <div className="text-sm sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground tracking-wide mb-1 leading-tight">
              <span className="block xs:inline">AVS</span>
              <span className="block xs:inline xs:ml-1 sm:ml-2">ENGINEERING</span>
              <span className="block xs:inline xs:ml-1 sm:ml-2">COLLEGE</span>
            </div>
            <div className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground font-medium mt-0.5 sm:mt-1 hidden xs:block">
              (Autonomous Status - Conferred by UGC)
            </div>
          </div>
          
          {/* Right Logo - NAAC Accreditation Badge */}
          <div className="w-12 h-12 sm:w-16 md:w-20 lg:w-24 sm:h-16 md:h-20 lg:h-24 flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-400 relative">
              {/* NAAC Badge Design */}
              <div className="text-center text-white">
                <div className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold bg-yellow-500 text-red-800 rounded-full w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 flex items-center justify-center mx-auto mb-0.5 sm:mb-1">
                  A
                </div>
                <div className="text-[5px] sm:text-[6px] md:text-[8px] lg:text-[10px] font-bold leading-tight">
                  <div>NAAC</div>
                </div>
              </div>
              {/* Ribbon */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-red-700 text-yellow-300 text-[4px] sm:text-[6px] md:text-[8px] px-0.5 sm:px-1 rounded-t font-bold">
                1st cycle
              </div>
            </div>
          </div>
        </div>
        
        {/* Department Header for IT */}
        <div className="text-center mt-2 sm:mt-3 md:mt-4 pt-2 sm:pt-3 border-t border-border">
          <div className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-foreground">
            Department of Information Technology
          </div>
        </div>
      </div>
    </div>
  );
}
