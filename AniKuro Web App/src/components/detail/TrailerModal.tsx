import React from 'react';
import { X } from 'lucide-react';

interface TrailerModalProps {
  trailerId: string | null;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ trailerId, onClose }) => {
  if (!trailerId) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl rounded-3xl overflow-hidden glass-panel border border-slate-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/80 text-white hover:bg-slate-800 transition-all shadow-lg"
        >
          <X size={18} />
        </button>
        <div className="aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${trailerId}?autoplay=1`}
            title="Anime Trailer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
