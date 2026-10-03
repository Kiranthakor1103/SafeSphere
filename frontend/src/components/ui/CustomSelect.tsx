import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  icon?: React.ReactNode;
  description?: string;
}

export type RawOption = SelectOption | string;

interface CustomSelectProps {
  label?: string;
  options: RawOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  size?: 'sm' | 'md';
  error?: string;
  name?: string;
  dropDirection?: 'down' | 'up';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  required = false,
  className = '',
  style,
  size = 'md',
  error,
  dropDirection = 'down',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState<'down' | 'up'>(dropDirection);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 230 && rect.top > 230) {
        setDirection('up');
      } else {
        setDirection('down');
      }
    } else {
      setDirection(dropDirection);
    }
  }, [isOpen, dropDirection]);

  // Normalize string array options into SelectOption objects
  const normalizedOptions: SelectOption[] = options.map(opt => {
    if (typeof opt === 'string') {
      const formattedLabel = opt
        .replace(/_/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return { value: opt, label: formattedLabel };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      className={`custom-select-group ${size === 'sm' ? 'custom-select-sm' : ''} ${className}`}
      style={{ ...style, zIndex: isOpen ? 9999 : (style?.zIndex || 1), position: 'relative' }}
      ref={containerRef}
    >
      {label && (
        <label className="custom-select-label">
          {label.replace(/\s*\*/g, '').trim()}
          {(required || label.includes('*')) && (
            <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}> *</span>
          )}
        </label>
      )}
      
      <div
        className={`custom-select-trigger ${isOpen ? 'is-open' : ''} ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <div className="custom-select-value">
          {selectedOption ? (
            <div className="custom-select-selected-content">
              {selectedOption.icon && <span className="option-icon">{selectedOption.icon}</span>}
              <span>{selectedOption.label}</span>
              {selectedOption.badge && <span className="option-badge">{selectedOption.badge}</span>}
            </div>
          ) : (
            <span className="custom-select-placeholder">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={size === 'sm' ? 14 : 16} className={`custom-select-chevron ${isOpen ? 'is-rotated' : ''}`} />
      </div>

      {isOpen && (
        <div className={`custom-select-dropdown ${direction === 'up' ? 'drop-up' : ''}`}>
          <ul className="custom-select-options">
            {normalizedOptions.map((option) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  className={`custom-select-option ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleSelect(option.value)}
                >
                  <div className="option-content">
                    {option.icon && <span className="option-icon">{option.icon}</span>}
                    <div className="option-text-group">
                      <span className="option-label">{option.label}</span>
                      {option.description && <span className="option-desc">{option.description}</span>}
                    </div>
                  </div>
                  <div className="option-trailing">
                    {option.badge && <span className="option-badge">{option.badge}</span>}
                    {isSelected && <Check size={14} className="option-check" />}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && <span className="custom-select-error">{error}</span>}
    </div>
  );
};
