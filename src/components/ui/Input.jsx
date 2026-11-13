import React from 'react';

const fieldClasses = "w-full px-4 py-2.5 glass-subtle text-emobi-black font-space text-sm focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-emobi-yellow/70 transition-all placeholder:text-emobi-black/40";

export const Input = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold uppercase tracking-wider font-unbounded text-emobi-black/80">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`${fieldClasses} rounded-2xl ${error ? 'ring-2 ring-red-500/70' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs font-bold text-red-600 mt-0.5">{error}</span>}
    </div>
  );
};

export const Textarea = ({
  label,
  error,
  className = '',
  id,
  rows = 3,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold uppercase tracking-wider font-unbounded text-emobi-black/80">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={`${fieldClasses} rounded-2xl resize-none ${error ? 'ring-2 ring-red-500/70' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs font-bold text-red-600 mt-0.5">{error}</span>}
    </div>
  );
};

export const Select = ({
  label,
  options = [],
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold uppercase tracking-wider font-unbounded text-emobi-black/80">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`${fieldClasses} rounded-2xl appearance-none cursor-pointer ${error ? 'ring-2 ring-red-500/70' : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs font-bold text-red-600 mt-0.5">{error}</span>}
    </div>
  );
};
