import React from 'react';

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-white/10 text-white border border-white/20',
    high: 'bg-black text-white border border-white/30 font-semibold',
    medium: 'bg-neutral-800 text-white border border-white/20',
    low: 'bg-neutral-900 text-neutral-300 border border-white/10',
    open: 'bg-white/20 text-white border border-white/30',
    inProgress: 'bg-neutral-700/50 text-white border border-white/20',
    resolved: 'bg-neutral-200 text-black border border-transparent font-medium',
    closed: 'bg-black text-neutral-400 border border-white/10'
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs tracking-wide ${selectedVariant} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
