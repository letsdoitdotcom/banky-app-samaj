import React, { useState, useRef, useEffect } from 'react';

interface AutocompleteInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  error?: string;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  className = '',
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (value && isOpen) {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered.slice(0, 10)); // Limit to 10 options
    } else {
      setFilteredOptions([]);
    }
  }, [value, options, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleOptionClick = (option: string) => {
    onChange(option);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow option click
    setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className="relative">
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={`input ${error ? 'input-error' : ''} ${className}`}
          autoComplete="off"
        />
        {isOpen && filteredOptions.length > 0 && (
          <ul
            ref={listRef}
            className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto mt-1"
          >
            {filteredOptions.map((option, index) => (
              <li
                key={index}
                onClick={() => handleOptionClick(option)}
                className="px-4 py-2 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
              >
                {option}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

interface FormattedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  formatter: (value: string) => string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  error?: string;
  maxLength?: number;
}

export const FormattedInput: React.FC<FormattedInputProps> = ({
  label,
  value,
  onChange,
  formatter,
  placeholder,
  required = false,
  className = '',
  error,
  maxLength
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatter(rawValue);
    onChange(formattedValue);
  };

  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`input ${error ? 'input-error' : ''} ${className}`}
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};