import React, { useState, useEffect } from 'react';
import { validatePassword, getStrengthColor, getStrengthBgColor, PasswordValidation } from '../utils/passwordValidation';

interface PasswordInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  error?: string;
  showValidation?: boolean;
  onValidationChange?: (validation: PasswordValidation) => void;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder = "Enter password",
  required = false,
  className = '',
  error,
  showValidation = true,
  onValidationChange
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [validation, setValidation] = useState<PasswordValidation>({ 
    isValid: false, 
    errors: [], 
    strength: 'weak' 
  });

  useEffect(() => {
    if (value && showValidation) {
      const newValidation = validatePassword(value);
      setValidation(newValidation);
      
      if (onValidationChange) {
        onValidationChange(newValidation);
      }
    } else {
      const emptyValidation = { isValid: false, errors: [], strength: 'weak' as const };
      setValidation(emptyValidation);
      
      if (onValidationChange) {
        onValidationChange(emptyValidation);
      }
    }
  }, [value, showValidation, onValidationChange]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`input pr-12 ${error ? 'input-error' : ''} ${className}`}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Password Validation Display */}
      {value && showValidation && (
        <div className="mt-2">
          {/* Strength Indicator */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm text-gray-600">Strength:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getStrengthBgColor(validation.strength)}`}
                style={{ 
                  width: validation.strength === 'weak' ? '33%' : 
                         validation.strength === 'medium' ? '66%' : '100%' 
                }}
              />
            </div>
            <span className={`text-sm font-medium capitalize ${getStrengthColor(validation.strength)}`}>
              {validation.strength}
            </span>
          </div>

          {/* Requirements List */}
          {validation.errors.length > 0 && (
            <div className="text-sm">
              <p className="text-gray-600 mb-1">Password must contain:</p>
              <ul className="space-y-1">
                {validation.errors.map((errorMsg, index) => (
                  <li key={index} className="flex items-center text-red-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {errorMsg}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Message */}
          {validation.isValid && (
            <div className="flex items-center text-green-600 text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Password meets all requirements!
            </div>
          )}
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
    </div>
  );
};