import React from 'react';
import { RelationEdge } from '../../types/anime';
import { getDisplayTitle } from '../../utils/formatters';
import { getAnimeCoverImage } from '../../utils/imageHelpers';
import { useDragToScroll } from '../../hooks/useDragToScroll';

interface RelationsListProps {
  relations?: {
    edges: RelationEdge[];
  };
  onSelectRelated: (animeId: number) => void;
}

export const RelationsList: React.FC<RelationsListProps> = ({ relations, onSelectRelated }) => {
  const { dragProps, isDragging } = useDragToScroll();

  if (!relations || !relations.edges || relations.edges.length === 0) {
    return <p className="text-xs text-slate-500">No franchise relations found.</p>;
  }

  return (
    <div
      {...dragProps}
      className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 select-none cursor-grab active:cursor-grabbing scroll-smooth"
    >
      {relations.edges.map((edge, idx) => {
        const node = edge.node;
        const title = getDisplayTitle(node.title);
        const coverSrc = getAnimeCoverImage(node.coverImage);

        return (
          <div
            key={idx}
            onClick={() => {
              if (!isDragging) onSelectRelated(node.id);
            }}
            className="shrink-0 w-28 p-2 rounded-2xl glass-card hover:border-sky-500/50 cursor-pointer active:scale-95 transition-all text-center space-y-1.5"
          >
            <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-slate-900">
              <img
                src={coverSrc}
                alt={title}
                draggable={false}
                className="w-full h-full object-cover pointer-events-none select-none"
              />
            </div>
            <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30">
              {edge.relationType.replace(/_/g, ' ')}
            </span>
            <p className="text-[10px] font-bold text-[var(--text-primary)] line-clamp-1">{title}</p>
          </div>
        );
      })}
    </div>
  );
};
