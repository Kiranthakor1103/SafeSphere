import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

const AccessDeniedPage = () => (
  <main className="access-denied">
    <div className="access-denied-card">
      <ShieldOff size={36} aria-hidden="true" />
      <h1>Access denied</h1>
      <p>Your current role does not have permission to open this module.</p>
      <Link to="/dashboard" className="btn btn-primary">Go to dashboard</Link>
    </div>
  </main>
);

export default AccessDeniedPage;
