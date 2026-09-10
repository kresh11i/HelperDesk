import React from 'react';

const PageContainer = ({ children, maxWidth = 'full', className = '' }) => {
  const maxWidthClass = {
    'lg': 'max-w-lg mx-auto w-full',
    '2xl': 'max-w-2xl mx-auto w-full',
    'full': 'w-full'
  }[maxWidth] || 'w-full';

  return (
    <div className={`flex flex-col gap-6 pb-8 h-full pt-4 md:pt-8 ${maxWidthClass} ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
