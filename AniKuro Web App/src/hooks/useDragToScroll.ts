import { useRef, useState, useCallback, useEffect } from 'react';

export function useDragToScroll(deps: any[] = []) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const [isDragging, setIsDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const rafIdRef = useRef<number | null>(null);

  const checkScroll = useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const el = containerRef.current;
      if (!el) return;
      const canLeft = el.scrollLeft > 10;
      const canRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 15;
      setCanScrollLeft((prev) => (prev !== canLeft ? canLeft : prev));
      setCanScrollRight((prev) => (prev !== canRight ? canRight : prev));
    });
  }, []);

  // Update scroll limits on mount, resize, and when dependencies change
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScroll();

    // Check after images and cards layout
    const t1 = setTimeout(checkScroll, 100);
    const t2 = setTimeout(checkScroll, 400);

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll, { passive: true });

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        checkScroll();
      });
      resizeObserver.observe(el);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      if (resizeObserver) resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkScroll, ...deps]);

  const onMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    isDownRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDownRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;

    if (Math.abs(walk) > 4) {
      if (!hasMovedRef.current) {
        hasMovedRef.current = true;
        setIsDragging(true);
      }
      e.preventDefault();
      el.scrollLeft = scrollLeftRef.current - walk;
    }
  };

  const onMouseUpOrLeave = () => {
    isDownRef.current = false;
    setTimeout(() => {
      hasMovedRef.current = false;
      setIsDragging(false);
    }, 60);
  };

  const scrollByDirection = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const step = Math.max(280, el.clientWidth * 0.75);
    el.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    });
    setTimeout(checkScroll, 350);
  };

  return {
    containerRef,
    isDragging,
    canScrollLeft,
    canScrollRight,
    scrollLeft: () => scrollByDirection('left'),
    scrollRight: () => scrollByDirection('right'),
    checkScroll,
    dragProps: {
      ref: containerRef,
      onMouseDown,
      onMouseMove,
      onMouseUp: onMouseUpOrLeave,
      onMouseLeave: onMouseUpOrLeave,
    },
  };
}
