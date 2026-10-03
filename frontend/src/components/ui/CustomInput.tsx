import React from 'react';

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  icon,
  rightIcon,
  error,
  helperText,
  className = '',
  style,
  ...props
}) => {
  return (
    <div className="custom-input-group">
      {label && (
        <label className="custom-input-label">
          {label.replace(/\s*\*/g, '').trim()}
          {(props.required || label.includes('*')) && (
            <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}> *</span>
          )}
        </label>
      )}
      <div className={`custom-input-wrapper ${error ? 'has-error' : ''}`}>
        {icon && <span className="custom-input-icon">{icon}</span>}
        <input
          className={`custom-input ${icon ? 'has-leading-icon' : ''} ${rightIcon ? 'has-trailing-icon' : ''} ${className}`}
          style={style}
          {...props}
        />
        {rightIcon && <span className="custom-input-right-icon">{rightIcon}</span>}
      </div>
      {error && <span className="custom-input-error">{error}</span>}
      {helperText && !error && <span className="custom-input-helper">{helperText}</span>}
    </div>
  );
};
