import React from 'react';

const GlassCard = ({ children, level = 1, className = '', ...props }) => {
  const baseClasses = 'rounded-2xl transition-all duration-300';
  const glassClasses = `glass-${level}`;
  
  return (
    <div 
      className={`${baseClasses} ${glassClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
