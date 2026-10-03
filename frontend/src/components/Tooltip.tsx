import React, { useEffect, useState } from 'react';

interface TooltipState {
  text: string;
  x: number;
  y: number;
  visible: boolean;
}

export const Tooltip: React.FC = () => {
  const [state, setState] = useState<TooltipState>({
    text: '',
    x: 0,
    y: 0,
    visible: false,
  });

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-tooltip]');
      if (target) {
        const text = target.getAttribute('data-tooltip') || '';
        const rect = target.getBoundingClientRect();
        
        // Position above the center of the target element
        const x = rect.left + rect.width / 2;
        const y = rect.top + window.scrollY;

        setState({
          text,
          x,
          y,
          visible: true,
        });
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-tooltip]');
      if (target) {
        setState(prev => ({ ...prev, visible: false }));
      }
    };

    const handleScroll = () => {
      setState(prev => ({ ...prev, visible: false }));
    };

    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!state.visible || !state.text) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: state.x,
        top: state.y,
        transform: 'translate(-50%, -125%)',
        background: 'rgba(37, 56, 88, 0.98)', // Premium Slate blue (var(--text-primary))
        color: '#ffffff',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 500,
        whiteSpace: 'normal',
        width: 'max-content',
        maxWidth: '280px',
        wordWrap: 'break-word',
        lineHeight: '1.4',
        textAlign: 'center',
        boxShadow: '0 6px 18px rgba(37, 56, 88, 0.25)',
        border: '1px solid rgba(66, 109, 196, 0.4)', // Accent blue border
        zIndex: 99999,
        pointerEvents: 'none',
        animation: 'tooltip-fade-in 0.15s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      }}
    >
      {state.text}
      {/* Tooltip Arrow */}
      <div
        style={{
          position: 'absolute',
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid rgba(37, 56, 88, 0.98)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
