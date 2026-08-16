import React, { useRef } from 'react';

const GlassCard = ({ children, level = 1, className = '', ...props }) => {
  const cardRef = useRef(null);
  const isAbsolute = className.includes('absolute') || className.includes('fixed');
  const baseClasses = `rounded-2xl transition-all duration-300 overflow-hidden group/glass ${isAbsolute ? '' : 'relative'}`;
  const glassClasses = `glass-${level}`;

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`${baseClasses} ${glassClasses} ${className}`}
      {...props}
    >
      {/* Edge lighting spotlight following cursor */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover/glass:opacity-100 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(180px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(255, 255, 255, 0.25), transparent 85%)',
          padding: '1.5px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          zIndex: 2
        }}
      />
      {children}
    </div>
  );
};

export default GlassCard;
