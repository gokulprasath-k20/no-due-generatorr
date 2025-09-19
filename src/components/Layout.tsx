import { ReactNode } from 'react';
import { CollegeHeader } from './CollegeHeader';

interface LayoutProps {
  children: ReactNode;
  className?: string;
  showHeader?: boolean;
}

export function Layout({ children, className = '', showHeader = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background safe-area-top">
      {showHeader && (
        <div className="mobile-nav">
          <CollegeHeader />
        </div>
      )}
      <main className={`max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-6 md:py-8 safe-area-bottom ${className}`}>
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
