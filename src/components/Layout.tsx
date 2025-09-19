import { ReactNode } from 'react';
import { CollegeHeader } from './CollegeHeader';

interface LayoutProps {
  children: ReactNode;
  className?: string;
  showHeader?: boolean;
}

export function Layout({ children, className = '', showHeader = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <CollegeHeader />}
      <main className={`max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8 ${className}`}>
        {children}
      </main>
    </div>
  );
}
