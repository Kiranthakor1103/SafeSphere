export const validatePhoneBackend = (countryCode: string = '+91', phone: string = '', required: boolean = true): string | null => {
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
