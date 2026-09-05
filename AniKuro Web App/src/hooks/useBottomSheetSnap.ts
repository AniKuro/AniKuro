import { useState, useRef, useCallback, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';
import { useBackHandler } from '../services/backHandler';

interface UseBottomSheetSnapOptions {
  isOpen: boolean;
  onClose?: () => void;
  initialExpanded?: boolean;
}

export function useBottomSheetSnap({ isOpen, onClose, initialExpanded = false }: UseBottomSheetSnapOptions) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  // Direct DOM references for 60/120fps hardware-composited manipulation
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const capsulePillRef = useRef<HTMLDivElement | null>(null);

  const touchStartY = useRef<number | null>(null);
  const currentDragYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isExpandedRef = useRef(isExpanded);
  isExpandedRef.current = isExpanded;

  const rafId = useRef<number | null>(null);

  // Reset state and direct DOM transforms when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setIsExpanded(false);
      currentDragYRef.current = 0;
      isDraggingRef.current = false;
      if (sheetRef.current) {
        sheetRef.current.style.transform = '';
        sheetRef.current.style.transition = '';
        sheetRef.current.style.opacity = '';
      }
      if (capsulePillRef.current) {
        capsulePillRef.current.style.width = '40px';
        capsulePillRef.current.style.height = '4px';
        capsulePillRef.current.style.backgroundColor = 'rgba(148, 163, 184, 0.65)';
        capsulePillRef.current.style.boxShadow = 'none';
        capsulePillRef.current.style.transition = '';
      }
    }
  }, [isOpen]);

  const animateToExpanded = useCallback((fromDragY = 0) => {
    setIsExpanded(true);
    triggerHaptic('medium');

    const sheet = sheetRef.current;
    const capsule = capsulePillRef.current;

    if (sheet) {
      const deltaHeight = window.innerHeight * 0.28;
      const startingY = fromDragY !== 0 ? fromDragY + deltaHeight : deltaHeight;

      sheet.style.transition = 'none';
      sheet.style.transform = `translate3d(0, ${startingY}px, 0)`;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (sheetRef.current) {
            sheetRef.current.style.transition = 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)';
            sheetRef.current.style.transform = 'translate3d(0, 0, 0)';
          }
        });
      });
    }

    if (capsule) {
      capsule.style.transition =
        'width 0.24s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, box-shadow 0.2s ease';
      capsule.style.width = '56px';
      capsule.style.height = '5.5px';
      capsule.style.backgroundColor = 'rgba(56, 189, 248, 0.95)';
      capsule.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.45)';
    }
  }, []);

  const animateToCollapsed = useCallback((fromDragY = 0) => {
    setIsExpanded(false);
    triggerHaptic('light');

    const sheet = sheetRef.current;
    const capsule = capsulePillRef.current;

    if (sheet) {
      const deltaHeight = window.innerHeight * 0.28;
      const startingY = fromDragY !== 0 ? fromDragY - deltaHeight : -deltaHeight;

      sheet.style.transition = 'none';
      sheet.style.transform = `translate3d(0, ${startingY}px, 0)`;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (sheetRef.current) {
            sheetRef.current.style.transition = 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)';
            sheetRef.current.style.transform = 'translate3d(0, 0, 0)';
          }
        });
      });
    }

    if (capsule) {
      capsule.style.transition =
        'width 0.24s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, box-shadow 0.2s ease';
      capsule.style.width = '40px';
      capsule.style.height = '4px';
      capsule.style.backgroundColor = 'rgba(148, 163, 184, 0.65)';
      capsule.style.boxShadow = 'none';
    }
  }, []);

  const expand = useCallback(() => {
    animateToExpanded(0);
  }, [animateToExpanded]);

  const collapse = useCallback(() => {
    animateToCollapsed(0);
  }, [animateToCollapsed]);

  // Back button handling: collapse back to half if expanded
  useBackHandler(
    isOpen && isExpanded,
    () => {
      collapse();
    },
    12
  );

  const toggleExpand = useCallback(() => {
    if (isExpandedRef.current) {
      collapse();
    } else {
      expand();
    }
  }, [expand, collapse]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDraggingRef.current = true;
    currentDragYRef.current = 0;

    // Immediately kill transitions for 1:1 instantaneous finger tracking with zero lag
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
    }
    if (capsulePillRef.current) {
      capsulePillRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const clientY = e.touches[0].clientY;
    const diff = clientY - touchStartY.current;

    const expanded = isExpandedRef.current;
    const deltaHeight = window.innerHeight * 0.28;
    let targetDrag = diff;

    if (!expanded) {
      // Half screen:
      // Allow sliding all the way to full screen (-deltaHeight) with natural 1:1 tracking
      if (diff < -deltaHeight) {
        const excess = -deltaHeight - diff;
        targetDrag = -deltaHeight - excess * 0.25;
      } else if (diff < 0) {
        targetDrag = diff;
      } else {
        // Sliding down: apply 0.55 resistance
        targetDrag = diff * 0.55;
      }
    } else {
      // Full screen:
      // Allow sliding down to half screen (+deltaHeight) with natural 1:1 tracking
      if (diff > deltaHeight) {
        const excess = diff - deltaHeight;
        targetDrag = deltaHeight + excess * 0.55;
      } else if (diff > 0) {
        targetDrag = diff;
      } else {
        // Sliding up past top: apply 0.25 resistance
        targetDrag = diff * 0.25;
      }
    }

    currentDragYRef.current = targetDrag;

    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const drag = currentDragYRef.current;
        const exp = isExpandedRef.current;

        // Direct DOM transform: 0 React re-renders, 0 JS garbage, locked 60/120 FPS GPU compositor
        if (sheetRef.current) {
          sheetRef.current.style.transform = `translate3d(0, ${drag}px, 0)`;
        }

        if (capsulePillRef.current) {
          const stretchProgress = Math.min(1, Math.abs(drag) / 100);
          const capsuleWidth = exp
            ? Math.max(38, 56 - (drag > 0 ? drag * 0.22 : 0))
            : Math.min(66, 40 + (drag < 0 ? Math.abs(drag) * 0.32 : 0));

          capsulePillRef.current.style.width = `${capsuleWidth}px`;
          capsulePillRef.current.style.height = '5px';
          capsulePillRef.current.style.backgroundColor =
            stretchProgress > 0.25
              ? 'rgba(56, 189, 248, 0.9)'
              : exp
              ? 'rgba(56, 189, 248, 0.95)'
              : 'rgba(148, 163, 184, 0.7)';
          capsulePillRef.current.style.boxShadow =
            stretchProgress > 0.25 || exp
              ? '0 0 10px rgba(56, 189, 248, 0.45)'
              : 'none';
        }
      });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartY.current === null) return;
    touchStartY.current = null;
    isDraggingRef.current = false;
    const finalDiff = currentDragYRef.current;
    currentDragYRef.current = 0;

    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    const exp = isExpandedRef.current;

    if (!exp) {
      // If pulled up by more than 28px -> seamlessly expand to full screen from release point
      if (finalDiff < -28) {
        animateToExpanded(finalDiff);
      }
      // If dragged down strongly by more than 90px and onClose exists -> dismiss
      else if (finalDiff > 90 && onClose) {
        triggerHaptic('light');
        if (sheetRef.current) {
          sheetRef.current.style.transition = 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s ease';
          sheetRef.current.style.transform = 'translate3d(0, 100%, 0)';
          sheetRef.current.style.opacity = '0';
        }
        setTimeout(() => {
          onClose();
        }, 200);
      } else {
        // Spring back to collapsed resting position
        if (sheetRef.current) {
          sheetRef.current.style.transition = 'transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1)';
          sheetRef.current.style.transform = 'translate3d(0, 0, 0)';
        }
        if (capsulePillRef.current) {
          capsulePillRef.current.style.transition =
            'width 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, box-shadow 0.2s ease';
          capsulePillRef.current.style.width = '40px';
          capsulePillRef.current.style.height = '4px';
          capsulePillRef.current.style.backgroundColor = 'rgba(148, 163, 184, 0.65)';
          capsulePillRef.current.style.boxShadow = 'none';
        }
      }
    } else {
      // If pulled down by more than 28px -> seamlessly collapse to half screen from release point
      if (finalDiff > 28) {
        animateToCollapsed(finalDiff);
      } else {
        // Spring back to expanded resting position
        if (sheetRef.current) {
          sheetRef.current.style.transition = 'transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1)';
          sheetRef.current.style.transform = 'translate3d(0, 0, 0)';
        }
        if (capsulePillRef.current) {
          capsulePillRef.current.style.transition =
            'width 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, box-shadow 0.2s ease';
          capsulePillRef.current.style.width = '56px';
          capsulePillRef.current.style.height = '5.5px';
          capsulePillRef.current.style.backgroundColor = 'rgba(56, 189, 248, 0.95)';
          capsulePillRef.current.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.45)';
        }
      }
    }
  }, [animateToExpanded, animateToCollapsed, onClose]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.deltaY < -10) {
      expand();
    } else if (e.deltaY > 10 && isExpandedRef.current) {
      collapse();
    }
  }, [expand, collapse]);

  return {
    isExpanded,
    setIsExpanded,
    expand,
    collapse,
    toggleExpand,
    sheetRef,
    capsulePillRef,
    // Optional fallbacks for backward compatibility
    sheetStyle: {
      willChange: 'transform' as const,
    },
    capsuleWidth: isExpanded ? 56 : 40,
    stretchProgress: 0,
    isDragging: false,
    dragY: 0,
    capsuleProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onWheel: handleWheel,
      onClick: () => {
        if (Math.abs(currentDragYRef.current) < 5) {
          toggleExpand();
        }
      },
      style: {
        touchAction: 'none' as const, // Prevents browser gesture conflicts and jitter
      },
    },
  };
}
