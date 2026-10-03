import React from 'react';
import { Shield, Loader2 } from 'lucide-react';

export interface LoaderProps {
  variant?: 'page' | 'overlay' | 'card' | 'inline' | 'button';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  subtext?: string;
  icon?: React.ReactNode;
  fullScreen?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Loader: React.FC<LoaderProps> = ({
  variant = 'page',
  size = 'md',
  text,
  subtext,
  icon,
  fullScreen = false,
  className = '',
  style,
}) => {
  // Size dimensions for rings and icons
  const sizeMap = {
    sm: { container: 24, ring: 24, icon: 12, fontSize: '12px' },
    md: { container: 48, ring: 48, icon: 20, fontSize: '14px' },
    lg: { container: 64, ring: 64, icon: 26, fontSize: '15px' },
    xl: { container: 84, ring: 84, icon: 34, fontSize: '17px' },
  };

  const dims = sizeMap[size] || sizeMap.md;

  if (variant === 'button') {
    return (
      <span className={`safesphere-btn-loader ${className}`} style={style}>
        <Loader2 size={dims.icon || 14} className="safesphere-spin-icon" />
        {text && <span className="safesphere-btn-loader-text">{text}</span>}
      </span>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`safesphere-loader-inline ${className}`} style={style}>
        <div className="safesphere-spinner-ring-mini" style={{ width: dims.ring, height: dims.ring }}>
          <div className="ring-gradient" />
        </div>
        {text && <span className="safesphere-loader-text-inline" style={{ fontSize: dims.fontSize }}>{text}</span>}
      </div>
    );
  }

  const isOverlay = variant === 'overlay' || fullScreen;

  const content = (
    <div className={`safesphere-loader-box safesphere-loader-${size} ${variant === 'card' ? 'is-card' : ''}`}>
      <div className="safesphere-spinner-wrapper" style={{ width: dims.container, height: dims.container }}>
        <div className="safesphere-spinner-ring outer-ring" />
        <div className="safesphere-spinner-ring inner-ring" />
        <div className="safesphere-spinner-pulse-glow" />
        <div className="safesphere-spinner-center-icon">
          {icon || <Shield size={dims.icon} className="safesphere-shield-glow" />}
        </div>
      </div>

      {(text || subtext) && (
        <div className="safesphere-loader-labels">
          {text && <h4 className="safesphere-loader-title" style={{ fontSize: dims.fontSize }}>{text}</h4>}
          {subtext && <p className="safesphere-loader-subtext">{subtext}</p>}
        </div>
      )}
    </div>
  );

  if (isOverlay) {
    return (
      <div className={`safesphere-loader-overlay ${fullScreen ? 'is-fullscreen' : ''} ${className}`} style={style}>
        <div className="safesphere-loader-glass-card">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={`safesphere-loader-container safesphere-loader-page ${className}`} style={style}>
      {content}
    </div>
  );
};

export default Loader;
