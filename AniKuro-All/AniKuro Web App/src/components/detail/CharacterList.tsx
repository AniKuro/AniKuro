import React from 'react';
import { CharacterEdge } from '../../types/anime';

interface CharacterListProps {
  characters?: {
    edges: CharacterEdge[];
  };
}

export const CharacterList: React.FC<CharacterListProps> = ({ characters }) => {
  if (!characters || !characters.edges || characters.edges.length === 0) {
    return <p className="text-xs text-slate-500">No character details available.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
      {characters.edges.slice(0, 8).map((edge, idx) => {
        const char = edge.node;
        const va = edge.voiceActors?.[0];

        return (
          <div key={idx} className="flex items-center gap-2 p-2 rounded-2xl glass-card border border-[var(--border-color)]">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-[var(--border-color)]">
              <img
                src={char.image.medium || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200'}
                alt={char.name.full}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-[var(--text-primary)] truncate">{char.name.full}</p>
              <p className="text-[9px] text-[var(--text-muted)] truncate">{edge.role.toLowerCase()}</p>
              {va && <p className="text-[9px] text-sky-500 truncate">VA: {va.name.full}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
