import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMeAPI } from '../services/api';
import toast from 'react-hot-toast';
import { X, User, Lock, MapPin, Globe, Camera } from 'lucide-react';
import { CustomInput, CustomButton, PhoneWithCountryInput, validatePhone } from './ui';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Form states
  const [name, setName] = useState('');
  const [phoneCode, setPhoneCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('0');
  const [lng, setLng] = useState('0');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [districtCode, setDistrictCode] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setCountry(user.country || 'India');
      setState(user.state || '');
      setDistrict(user.district || '');
      setDistrictCode(user.districtCode || '');
      setAddress(user.location?.address || '');
      setLat(String(user.location?.lat ?? 0));
      setLng(String(user.location?.lng ?? 0));
      setProfilePhoto(user.profilePhoto || '');
      setPassword('');
      setConfirmPassword('');
      setErrors({});
      setSelectedFile(null);
      setPreviewUrl('');

      // Parse phone
      let parsedCode = '+91';
      let parsedNumber = '';
      if (user.phone) {
        const countryCodes = ['+91', '+1', '+44', '+61', '+971', '+65', '+81', '+49', '+33', '+86'];
        const matched = countryCodes.find(c => user.phone.startsWith(c));
        if (matched) {
          parsedCode = matched;
          parsedNumber = user.phone.slice(matched.length).trim();
        } else {
          const parts = user.phone.split(' ');
          if (parts.length > 1 && parts[0].startsWith('+')) {
            parsedCode = parts[0];
            parsedNumber = parts.slice(1).join(' ');
          } else {
            parsedNumber = user.phone;
          }
        }
      }
      setPhoneCode(parsedCode);
      setPhoneNumber(parsedNumber);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size cannot exceed 5MB.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (name.trim().length > 100) {
      newErrors.name = 'Name cannot exceed 100 characters';
    }

    // Validate phone
    const phoneErr = validatePhone(phoneCode, phoneNumber, false);
    if (phoneErr) {
      newErrors.phone = phoneErr;
    }

    // Validate password if provided
    if (password) {
      if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix validation errors before saving.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone', phoneNumber ? `${phoneCode} ${phoneNumber.trim()}` : '');
      formData.append('country', country.trim());
      formData.append('state', state.trim());
      formData.append('district', district.trim());
      formData.append('location', JSON.stringify({
        address: address.trim(),
        lat: Number(lat) || 0,
        lng: Number(lng) || 0
      }));
      if (password) {
        formData.append('password', password);
      }

      if (selectedFile) {
        formData.append('image', selectedFile);
      } else {
        formData.append('profilePhoto', profilePhoto.trim());
      }

      await updateMeAPI(formData);
      await refreshUser();
      toast.success('Profile updated successfully!');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const displayPhoto = previewUrl || profilePhoto;

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal" style={{ maxWidth: '600px', width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Profile Settings</h2>
          <button type="button" className="btn-ghost btn btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
          <div className="modal-body" style={{ overflowY: 'auto', padding: '24px' }}>
            
            {/* User Avatar Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', padding: '16px 20px', background: 'rgba(255, 255, 255, 0.45)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {displayPhoto ? (
                  <img 
                    src={displayPhoto} 
                    alt="Profile" 
                    style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-blue)', boxShadow: 'var(--shadow-sm)', display: 'block' }} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                      setProfilePhoto('');
                      setPreviewUrl('');
                      setSelectedFile(null);
                    }}
                  />
                ) : (
                  <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-blue), #2563eb)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '24px',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {initials}
                  </div>
                )}

                {displayPhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfilePhoto('');
                      setPreviewUrl('');
                      setSelectedFile(null);
                    }}
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      background: '#ef4444',
                      color: 'white',
                      border: '2px solid white',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                      padding: 0,
                      zIndex: 10
                    }}
                    title="Remove photo"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                )}

                <label 
                  title="Upload photo"
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--accent-blue)',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    cursor: 'pointer'
                  }}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageSelect} 
                    style={{ display: 'none' }}
                  />
                  <Camera size={13} />
                </label>
              </div>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{user.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user.email}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <span className="badge badge-blue" style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', textTransform: 'uppercase' }}>
                    Role: {user.role?.replace('_', ' ').toUpperCase()}
                  </span>
                  {districtCode && (
                    <span className="badge" style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', letterSpacing: '0.5px' }}>
                      🗺 {districtCode}
                    </span>
                  )}
                  <label 
                    className="btn btn-secondary btn-sm" 
                    style={{ 
                      cursor: 'pointer', 
                      margin: 0, 
                      padding: '3px 10px', 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageSelect} 
                      style={{ display: 'none' }}
                    />
                    <Camera size={12} />
                    Change Photo
                  </label>
                </div>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <CustomInput 
                  label="Full Name *" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  error={errors.name}
                  icon={<User size={16} />}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <PhoneWithCountryInput 
                  label="Contact Phone"
                  countryCode={phoneCode}
                  contactPhone={phoneNumber}
                  onCountryCodeChange={setPhoneCode}
                  onContactPhoneChange={setPhoneNumber}
                  error={errors.phone}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <CustomInput 
                  label="Country" 
                  value={country} 
                  onChange={e => setCountry(e.target.value)} 
                  placeholder="e.g. India"
                  icon={<Globe size={16} />}
                />
              </div>

              <div>
                <CustomInput 
                  label="State" 
                  value={state} 
                  onChange={e => setState(e.target.value)} 
                  placeholder="e.g. Delhi"
                  icon={<Globe size={16} />}
                />
              </div>

              <div>
                <CustomInput 
                  label="District" 
                  value={district} 
                  onChange={e => setDistrict(e.target.value)} 
                  placeholder="e.g. New Delhi"
                  icon={<Globe size={16} />}
                />
              </div>



              <div style={{ gridColumn: 'span 2' }}>
                <CustomInput 
                  label="Location Address" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  placeholder="Enter location or street address"
                  icon={<MapPin size={16} />}
                />
              </div>

              <div>
                <CustomInput 
                  label="Latitude" 
                  type="number" 
                  step="any"
                  value={lat} 
                  onChange={e => setLat(e.target.value)} 
                />
              </div>

              <div>
                <CustomInput 
                  label="Longitude" 
                  type="number" 
                  step="any"
                  value={lng} 
                  onChange={e => setLng(e.target.value)} 
                />
              </div>

              {/* Password Section */}
              <div style={{ gridColumn: 'span 2', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={15} /> Change Password (Optional)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <CustomInput 
                    label="New Password" 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Min 6 characters"
                    error={errors.password}
                  />
                  <CustomInput 
                    label="Confirm New Password" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="Repeat password"
                    error={errors.confirmPassword}
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', padding: '16px 24px' }}>
            <CustomButton type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </CustomButton>
            <CustomButton type="submit" variant="primary" loading={submitting}>
              Save Settings
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
