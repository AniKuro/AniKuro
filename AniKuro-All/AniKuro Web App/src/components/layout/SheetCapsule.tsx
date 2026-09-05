import React from 'react';

interface SheetCapsuleProps {
  isExpanded: boolean;
  capsulePillRef?: React.RefObject<HTMLDivElement | null>;
  capsuleWidth?: number;
  stretchProgress?: number;
  isDragging?: boolean;
  capsuleProps?: {
    onTouchStart?: (e: React.TouchEvent) => void;
    onTouchMove?: (e: React.TouchEvent) => void;
    onTouchEnd?: (e: React.TouchEvent) => void;
    onWheel?: (e: React.WheelEvent) => void;
    onClick?: (e: React.MouseEvent) => void;
    style?: React.CSSProperties;
  };
  className?: string;
}

export const SheetCapsule: React.FC<SheetCapsuleProps> = ({
  isExpanded,
  capsulePillRef,
  capsuleWidth,
  stretchProgress = 0,
  isDragging = false,
  capsuleProps,
  className = '',
}) => {
  const width = capsuleWidth ?? (isExpanded ? 56 : 40);

  return (
    <div
      {...capsuleProps}
      className={`w-full py-2.5 sm:hidden flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none shrink-0 ${className}`}
      style={{
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        ...capsuleProps?.style,
      }}
      title={isExpanded ? 'Drag down or tap to restore half screen' : 'Scroll up, drag up, or tap for full screen'}
      aria-label={isExpanded ? 'Collapse to half screen' : 'Expand to full screen'}
    >
      <div
        ref={capsulePillRef}
        className="rounded-full flex items-center justify-center pointer-events-none"
        style={{
          width: `${width}px`,
          height: isDragging ? '5px' : isExpanded ? '5.5px' : '4px',
          backgroundColor: isExpanded
            ? 'rgba(56, 189, 248, 0.95)'
            : stretchProgress > 0.25
            ? 'rgba(56, 189, 248, 0.85)'
            : 'rgba(148, 163, 184, 0.65)',
          boxShadow: isExpanded || stretchProgress > 0.25
            ? '0 0 10px rgba(56, 189, 248, 0.45)'
            : 'none',
          transition: isDragging
            ? 'none'
            : 'width 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
          willChange: 'width, transform',
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)',
        }}
      />
    </div>
  );
};

