import React, { useState } from 'react';
import { Tv } from 'lucide-react';

interface ChannelLogoProps {
  url: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ChannelLogo: React.FC<ChannelLogoProps> = ({
  url,
  name,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg text-xs',
    md: 'w-11 h-11 rounded-xl text-sm',
    lg: 'w-16 h-16 rounded-2xl text-base',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  };

  const getInitials = (str: string) => {
    if (!str) return 'TV';
    const words = str.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  if (!url || hasError) {
    return (
      <div
        className={`${sizeClasses[size]} bg-gradient-to-tr from-slate-100 to-gray-200 border border-gray-300 flex flex-col items-center justify-center text-gray-500 font-bold shrink-0 shadow-2xs select-none ${className}`}
        title={name}
      >
        <Tv className={`${iconSizes[size]} text-gray-400 mb-0.5`} />
        {size !== 'sm' && <span className="text-[9px] tracking-tight">{getInitials(name)}</span>}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs p-1 ${className}`}
    >
      <img
        src={url}
        alt={`Logo ${name}`}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  );
};

