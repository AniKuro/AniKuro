import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased font-sans selection:bg-sky-500 selection:text-white flex flex-col transition-colors duration-200">
      {/* Edge-to-Edge Responsive Web Application Canvas */}
      <div className="w-full flex-1 flex flex-col relative min-h-screen">
        {children}
      </div>
    </div>
  );
};