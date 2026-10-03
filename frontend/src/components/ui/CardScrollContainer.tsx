import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, ArrowLeftRight } from 'lucide-react';
import { CustomButton } from './CustomButton';

interface CardScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const CardScrollContainer: React.FC<CardScrollContainerProps> = ({
  children,
  className = '',
  title
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [viewMode, setViewMode] = useState<'scroll' | 'grid'>('scroll');

  const checkScroll = () => {
    if (!containerRef.current || viewMode !== 'scroll') return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = containerRef.current;
    if (el && viewMode === 'scroll') {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [children, viewMode]);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const scrollAmount = containerRef.current.clientWidth + 20; // card width + gap
    containerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className={`card-scroll-section ${className}`}>
      {(React.Children.count(children) > 1 || title) && (
        <div className="card-scroll-toolbar">
          {title && <div className="card-scroll-title">{title}</div>}
          {React.Children.count(children) > 1 && (
            <div className="card-scroll-controls">
              <CustomButton
                variant="secondary"
                size="sm"
                icon={viewMode === 'scroll' ? <LayoutGrid size={15} /> : <ArrowLeftRight size={15} />}
                onClick={() => setViewMode(viewMode === 'scroll' ? 'grid' : 'scroll')}
              >
                {viewMode === 'scroll' ? 'Grid View' : 'Scroll View'}
              </CustomButton>
            </div>
          )}
        </div>
      )}

      {viewMode === 'scroll' ? (
        <div className="card-scroll-wrapper">
          <button
            type="button"
            className={`card-scroll-btn card-scroll-btn-left ${!canScrollLeft ? 'disabled' : ''}`}
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll Left"
          >
            <ChevronLeft size={22} />
          </button>

          <div className="card-scroll-track" ref={containerRef}>
            {children}
          </div>

          <button
            type="button"
            className={`card-scroll-btn card-scroll-btn-right ${!canScrollRight ? 'disabled' : ''}`}
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll Right"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      ) : (
        <div className="card-grid-view">
          {children}
        </div>
      )}
    </div>
  );
};
