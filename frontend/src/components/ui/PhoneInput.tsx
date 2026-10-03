import React from 'react';

export const COUNTRY_CODES = [
  { code: '+91', country: '🇮🇳 +91' },
  { code: '+1', country: '🇺🇸 +1' },
  { code: '+44', country: '🇬🇧 +44' },
  { code: '+61', country: '🇦🇺 +61' },
  { code: '+971', country: '🇦🇪 +971' },
  { code: '+65', country: '🇸🇬 +65' },
  { code: '+81', country: '🇯🇵 +81' },
  { code: '+49', country: '🇩🇪 +49' },
  { code: '+33', country: '🇫🇷 +33' },
  { code: '+86', country: '🇨🇳 +86' },
];

export const validatePhone = (countryCode: string = '+91', phone: string = '', required: boolean = true): string | null => {
  const trimmed = (phone || '').trim();
  if (!trimmed) {
    return required ? 'Contact phone is required' : null;
  }
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (countryCode === '+91') {
    if (digitsOnly.length !== 10) {
      return 'Indian mobile number must be exactly 10 digits';
    }
    if (!/^[6-9]/.test(digitsOnly)) {
      return 'Indian mobile number must start with 6, 7, 8, or 9';
    }
  } else {
    if (digitsOnly.length < 7 || digitsOnly.length > 14) {
      return 'Phone number must be between 7 and 14 digits';
    }
  }
  return null;
};

export const formatPhoneDisplay = (phone?: string, countryCode?: string): string => {
  if (!phone) return '—';
  const trimmed = phone.trim();
  if (!trimmed) return '—';

  // If countryCode is explicitly provided separately
  if (countryCode) {
    const code = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
    const cleanPhone = trimmed.replace(/^\+\d{1,3}\s?/, '');
    return `${code} ${cleanPhone}`;
  }

  if (trimmed.includes(' ')) return trimmed;

  const match = trimmed.match(/^(\+\d{1,3})(\d+)$/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }

  return trimmed;
};

interface PhoneWithCountryInputProps {
  label?: string;
  countryCode: string;
  contactPhone: string;
  onCountryCodeChange: (code: string) => void;
  onContactPhoneChange: (phone: string) => void;
  onBlur?: (e: any) => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  name?: string;
}

export const PhoneWithCountryInput: React.FC<PhoneWithCountryInputProps> = ({
  label = 'Contact Phone',
  countryCode = '+91',
  contactPhone = '',
  onCountryCodeChange,
  onContactPhoneChange,
  onBlur,
  error,
  touched,
  required = false,
  name = 'contactPhone',
}) => {
  const calcError = validatePhone(countryCode, contactPhone, required);
  const displayError = error || (touched || contactPhone ? calcError : null);
  const hasError = !!displayError && (touched || !!contactPhone);

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawVal = e.target.value;
    if (countryCode === '+91') {
      rawVal = rawVal.replace(/\D/g, ''); // Numeric digits only for India
      if (rawVal.length > 10) {
        rawVal = rawVal.slice(0, 10);
      }
    } else {
      rawVal = rawVal.replace(/[^0-9\s-]/g, '');
      if (rawVal.length > 15) {
        rawVal = rawVal.slice(0, 15);
      }
    }
    onContactPhoneChange(rawVal);
  };

  const handleCountrySelectChange = (newCode: string) => {
    onCountryCodeChange(newCode);
    if (newCode === '+91') {
      const cleanDigits = contactPhone.replace(/\D/g, '').slice(0, 10);
      onContactPhoneChange(cleanDigits);
    }
  };

  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label.replace(/\s*\*/g, '').trim()}{' '}
          {required || label.includes('*') ? (
            <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>*</span>
          ) : (
            ''
          )}
        </label>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px' }}>
        <select
          className="form-select"
          value={countryCode || '+91'}
          onChange={e => handleCountrySelectChange(e.target.value)}
          style={{ height: '42px', fontSize: '13px', padding: '0 8px' }}
        >
          {COUNTRY_CODES.map(item => (
            <option key={item.code} value={item.code}>
              {item.country}
            </option>
          ))}
        </select>
        <input
          type="tel"
          name={name}
          maxLength={countryCode === '+91' ? 10 : 15}
          className={`form-input ${hasError ? 'is-invalid' : ''}`}
          value={contactPhone}
          onChange={handlePhoneInputChange}
          onBlur={onBlur}
          placeholder={countryCode === '+91' ? '10-digit mobile no.' : 'e.g. 9876543210'}
        />
      </div>
      {hasError && (
        <div className="form-error-msg" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
          {displayError}
        </div>
      )}
    </div>
  );
};

// Also export CustomPhoneInput for compatibility
export const CustomPhoneInput = PhoneWithCountryInput;

export default PhoneWithCountryInput;
