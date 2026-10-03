import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Home, ArrowLeft, MapPin } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="notfound-wrapper">
      {/* Animated floating shapes background */}
      <div className="notfound-bg-shapes">
        <div className="notfound-shape notfound-shape-1" />
        <div className="notfound-shape notfound-shape-2" />
        <div className="notfound-shape notfound-shape-3" />
        <div className="notfound-shape notfound-shape-4" />
        <div className="notfound-shape notfound-shape-5" />
      </div>

      <div className={`notfound-content ${mounted ? 'notfound-visible' : ''}`}>
        {/* Brand */}
        <div className="notfound-brand">
          <div className="notfound-brand-icon">
            <Shield size={20} color="white" />
          </div>
          <span className="notfound-brand-text">DisasterConnect</span>
        </div>

        {/* Giant 404 */}
        <div className="notfound-hero">
          <div className="notfound-404">
            <span className="notfound-digit">4</span>
            <div className="notfound-icon-ring">
              <MapPin size={38} />
            </div>
            <span className="notfound-digit">4</span>
          </div>
        </div>

        {/* Copy */}
        <h1 className="notfound-title">Location Not Found</h1>
        <p className="notfound-message">
          The page you're searching for doesn't exist on our emergency network,
          or it may have been moved to a different sector.
        </p>

        {/* Action buttons */}
        <div className="notfound-actions">
          <Link to="/dashboard" className="notfound-btn notfound-btn-primary">
            <Home size={18} />
            <span>Go to Dashboard</span>
          </Link>
          <button onClick={() => window.history.back()} className="notfound-btn notfound-btn-ghost">
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </button>
        </div>

        {/* Status indicator */}
        <div className="notfound-status-bar">
          <span className="notfound-status-dot" />
          <span>All emergency systems operational</span>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
