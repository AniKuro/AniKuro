import React from 'react';
import { APP_ICON_BASE64 } from '../../assets/logoBase64';

interface AnikuroLogoProps {
  size?: number;
  showText?: boolean;
  mascot?: 'female' | 'male';
}

export const AnikuroLogo: React.FC<AnikuroLogoProps> = ({
  size = 40,
  showText = true,
  mascot = 'female',
}) => {
  return (
    <div className="flex items-center gap-2.5 select-none cursor-pointer">
      <div
        className="relative overflow-hidden rounded-xl shadow-lg border-2 border-sky-400/50 group-hover:scale-105 transition-transform bg-[#0d1b2e] shrink-0"
        style={{ width: size, height: size }}
      >
        <img
          src={APP_ICON_BASE64}
          alt="AniKuro Logo"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl" />
      </div>

      {showText && (
        <div className="flex items-center gap-1.5">
          <span className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-sky-400 via-indigo-200 to-pink-400 bg-clip-text text-transparent leading-none">
            Anikuro
          </span>
          <span className="inline-block text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 whitespace-nowrap">
            アニクロ
          </span>
        </div>
      )}
    </div>
  );
};
