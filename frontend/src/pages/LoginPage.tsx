import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginAPI, registerAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Shield, Eye, EyeOff, User, Mail, Lock, MapPin, Search, Globe } from 'lucide-react';
import { CustomInput, CustomSelect, CustomButton, SelectOption, PhoneWithCountryInput, validatePhone } from '../components/ui';
import { getCountries, getStatesForCountry, getDistrictsForState, generateDistrictCode } from '../utils/locationData';

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'citizen', label: 'Citizen', badge: 'Public', description: 'General public & emergency reporters' },
  { value: 'volunteer', label: 'Volunteer', badge: 'Field', description: 'Registered disaster relief volunteer' },
  { value: 'rescue_team', label: 'Rescue Team', badge: 'Ops', description: 'First responders & emergency rescue unit' },
  { value: 'shelter_manager', label: 'Shelter Manager', badge: 'Ops', description: 'Emergency shelter & facility manager' },
  { value: 'district_admin', label: 'District Admin', badge: 'Admin', description: 'Regional coordinator & incident commander' },
  { value: 'super_admin', label: 'Super Admin', badge: 'System', description: 'Full system platform administrator' },
];

// Roles that require district scoping
const DISTRICT_SCOPED_ROLES = ['district_admin', 'shelter_manager', 'rescue_team', 'volunteer'];

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'citizen', phone: '' });
  const [phoneCode, setPhoneCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // District scoping fields
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedState, setSelectedState] = useState('Select State');
  const [selectedDistrict, setSelectedDistrict] = useState('Select District / Region');
  const [districtSearch, setDistrictSearch] = useState('');
  const [districtCode, setDistrictCode] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const showDistrictFields = DISTRICT_SCOPED_ROLES.includes(form.role);

  // Recompute district code whenever selections change
  useEffect(() => {
    if (
      selectedCountry && !selectedCountry.startsWith('Select') &&
      selectedState && !selectedState.startsWith('Select') &&
      selectedDistrict && !selectedDistrict.startsWith('Select')
    ) {
      const code = generateDistrictCode(selectedCountry, selectedState, selectedDistrict);
      setDistrictCode(code);
    } else {
      setDistrictCode('');
    }
  }, [selectedCountry, selectedState, selectedDistrict]);

  useEffect(() => {
    setPhoneCode('+91');
    setPhoneNumber('');
    setErrors({});
    if (!showDistrictFields) {
      setSelectedCountry('India');
      setSelectedState('Select State');
      setSelectedDistrict('Select District / Region');
      setDistrictSearch('');
      setDistrictCode('');
    }
  }, [mode, form.role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleChange = (role: string) => {
    setForm(prev => ({ ...prev, role }));
  };

  // Get filtered district list based on search
  const allDistricts = getDistrictsForState(selectedCountry, selectedState);
  const filteredDistricts = districtSearch.trim()
    ? allDistricts.filter(d =>
        d.toLowerCase().includes(districtSearch.toLowerCase()) || d.startsWith('Select')
      )
    : allDistricts;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === 'register') {
      if (!form.name.trim()) {
        newErrors.name = 'Please enter your full name.';
      }
      const phoneErr = validatePhone(phoneCode, phoneNumber, false);
      if (phoneErr) {
        newErrors.phone = phoneErr;
      }
      if (showDistrictFields) {
        if (!selectedState || selectedState.startsWith('Select')) {
          newErrors.state = 'Please select a state.';
        }
        if (!selectedDistrict || selectedDistrict.startsWith('Select')) {
          newErrors.district = 'Please select your assigned district.';
        }
      }
    }

    if (!form.email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!form.password) {
      newErrors.password = 'Please enter your password.';
    } else if (mode === 'register' && form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await loginAPI({ email: form.email.trim(), password: form.password });
        login(res.data.token, res.data.user);
        toast.success(`Welcome back, ${res.data.user.name}!`);
        navigate('/dashboard');
      } else {
        const payload: any = {
          ...form,
          email: form.email.trim(),
          phone: phoneNumber ? `${phoneCode} ${phoneNumber.trim()}` : ''
        };
        if (showDistrictFields) {
          payload.country = selectedCountry;
          payload.state = selectedState;
          payload.district = selectedDistrict;
          payload.districtCode = districtCode;
        }
        const res = await registerAPI(payload);
        login(res.data.token, res.data.user);
        toast.success('Account created successfully!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div
        className="auth-card"
        style={{
          maxWidth: mode === 'register' ? 560 : 440,
          transition: 'max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Shield size={28} color="white" />
          </div>
          <div className="auth-title">DisasterConnect</div>
          <div className="auth-subtitle">
            {mode === 'login' ? 'Sign in to your emergency dashboard' : 'Create your account to join the platform'}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <>
              <CustomInput
                label="Full Name *"
                name="name"
                placeholder="John Doe"
                icon={<User size={16} />}
                value={form.name}
                onChange={handleChange}
                error={errors.name}
              />
              <PhoneWithCountryInput
                label="Phone"
                countryCode={phoneCode}
                contactPhone={phoneNumber}
                onCountryCodeChange={setPhoneCode}
                onContactPhoneChange={(val) => {
                  setPhoneNumber(val);
                  if (errors.phone) {
                    setErrors(prev => ({ ...prev, phone: '' }));
                  }
                }}
                error={errors.phone}
              />
            </>
          )}

          <CustomInput
            label="Email Address *"
            name="email"
            type="email"
            placeholder="kiran@example.com"
            icon={<Mail size={16} />}
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />

          <CustomInput
            label="Password *"
            name="password"
            type={showPass ? 'text' : 'password'}
            placeholder="••••••••"
            icon={<Lock size={16} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />

          {mode === 'register' && (
            <CustomSelect
              label="Account Role & System Scope"
              options={ROLE_OPTIONS}
              value={form.role}
              onChange={handleRoleChange}
              placeholder="Select account role..."
            />
          )}

          {/* ── District Scope Panel (shown for regional roles) ── */}
          {mode === 'register' && showDistrictFields && (
            <div style={{
              marginTop: 14,
              padding: '16px 18px',
              background: 'linear-gradient(135deg, rgba(14,165,233,0.07), rgba(16,185,129,0.06))',
              border: '1px solid rgba(14,165,233,0.25)',
              borderRadius: 14,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decorative corner accent */}
              <div style={{
                position: 'absolute',
                top: 0, right: 0,
                width: 60, height: 60,
                background: 'linear-gradient(225deg, rgba(14,165,233,0.12), transparent)',
                borderBottomLeftRadius: 60
              }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{
                  width: 28, height: 28,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <MapPin size={14} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    Assigned District Scope
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                    Your admin access will be limited to this district only
                  </div>
                </div>
              </div>

              {/* Country & State */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
                    <Globe size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />Country
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={e => {
                      setSelectedCountry(e.target.value);
                      setSelectedState('Select State');
                      setSelectedDistrict('Select District / Region');
                      setDistrictSearch('');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    {getCountries().map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
                    State / Province
                  </label>
                  <select
                    value={selectedState}
                    onChange={e => {
                      setSelectedState(e.target.value);
                      setSelectedDistrict('Select District / Region');
                      setDistrictSearch('');
                      if (errors.state) setErrors(p => ({ ...p, state: '' }));
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: errors.state ? '1px solid #ef4444' : '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: selectedState.startsWith('Select') ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontSize: 13,
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    {getStatesForCountry(selectedCountry).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.state && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{errors.state}</div>}
                </div>
              </div>

              {/* District with Search */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
                  <MapPin size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />District / City *
                </label>

                {/* Search box */}
                <div style={{ position: 'relative', marginBottom: 6 }}>
                  <Search size={13} style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', pointerEvents: 'none'
                  }} />
                  <input
                    type="text"
                    placeholder="Search district..."
                    value={districtSearch}
                    onChange={e => setDistrictSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 30px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* District dropdown */}
                <select
                  value={selectedDistrict}
                  onChange={e => {
                    setSelectedDistrict(e.target.value);
                    setDistrictSearch('');
                    if (errors.district) setErrors(p => ({ ...p, district: '' }));
                  }}
                  size={Math.min(filteredDistricts.length, 5)}
                  style={{
                    width: '100%',
                    borderRadius: 8,
                    border: errors.district ? '1px solid #ef4444' : '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    cursor: 'pointer',
                    outline: 'none',
                    overflowY: 'auto',
                    maxHeight: 140
                  }}
                >
                  {filteredDistricts.map(d => (
                    <option key={d} value={d} style={{
                      padding: '6px 10px',
                      color: d.startsWith('Select') ? 'var(--text-muted)' : 'var(--text-primary)'
                    }}>
                      {d}
                    </option>
                  ))}
                </select>
                {errors.district && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{errors.district}</div>}
              </div>

              {/* Unique District ID Badge */}
              {districtCode ? (
                <div style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(14,165,233,0.08))',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 9,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <div style={{
                    width: 22, height: 22,
                    borderRadius: 6,
                    background: 'rgba(16,185,129,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, flexShrink: 0
                  }}>✅</div>
                  <div>
                    <div style={{ fontSize: 10, color: '#10b981', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Unique District ID Assigned
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.5px', marginTop: 1 }}>
                      {districtCode}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                      {selectedDistrict} · {selectedState} · {selectedCountry}
                    </div>
                  </div>
                </div>
              ) : selectedState && !selectedState.startsWith('Select') ? (
                <div style={{
                  marginTop: 10,
                  padding: '7px 11px',
                  background: 'rgba(251,191,36,0.08)',
                  border: '1px solid rgba(251,191,36,0.25)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#f59e0b',
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  ⚠️ Select a district above to get your Unique ID
                </div>
              ) : null}
            </div>
          )}

          <CustomButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
            style={{ marginTop: 12, height: 46 }}
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </CustomButton>
        </form>

        <div style={{ textAlign: 'center', marginTop: 22, fontSize: 14, color: 'var(--text-secondary)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-blue)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 14,
              textDecoration: 'underline'
            }}
          >
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
