import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';
  
  const variants = {
    primary: 'bg-white text-black hover:bg-neutral-200',
    secondary: 'bg-white/5 text-white border border-white/10 hover:bg-white/10',
    danger: 'bg-[#111111] text-white border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700',
    ghost: 'bg-transparent text-neutral-400 hover:text-white hover:bg-white/5'
  };

  const selectedVariant = variants[variant] || variants.primary;

  return (
    <button 
      className={`${baseClasses} ${selectedVariant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
