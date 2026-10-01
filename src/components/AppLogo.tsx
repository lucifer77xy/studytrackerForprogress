import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = 'w-9 h-9', size = 36 }) => {
  return (
    <div
      className={`relative rounded-xl overflow-hidden shadow-lg shadow-purple-500/20 ring-1 ring-white/10 shrink-0 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Split container background */}
        <rect x="0" y="0" width="50" height="100" fill="#24262c" />
        <rect x="50" y="0" width="50" height="100" fill="#30333b" />
        {/* Border stroke */}
        <rect x="1" y="1" width="98" height="98" rx="18" fill="none" stroke="#16171b" strokeWidth="4" />
        {/* Code bracket symbol: < / > */}
        <line x1="57" y1="28" x2="43" y2="72" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
        <path d="M 39 36 L 22 50 L 39 64" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 61 36 L 78 50 L 61 64" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};
