import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3800);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: {
      bg: 'bg-neutral-900 border-green-500/50 text-white',
      iconColor: 'text-green-500',
      icon: CheckCircle,
      glow: 'shadow-[0_4px_20px_rgba(34,197,94,0.15)]',
    },
    error: {
      bg: 'bg-neutral-900 border-red-500/50 text-white',
      iconColor: 'text-red-500',
      icon: AlertCircle,
      glow: 'shadow-[0_4px_20px_rgba(239,68,68,0.15)]',
    },
    info: {
      bg: 'bg-neutral-900 border-blue-500/50 text-white',
      iconColor: 'text-blue-500',
      icon: Info,
      glow: 'shadow-[0_4px_20px_rgba(59,130,246,0.15)]',
    },
  };

  const { bg, iconColor, icon: Icon, glow } = config[type] || config.success;

  return (
    <div 
      className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-300 ${bg} ${glow} w-full max-w-sm`}
      role="alert"
    >
      <div className="flex items-center gap-3 w-full overflow-hidden">
        <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
        <span className="text-sm font-medium leading-tight whitespace-normal break-words">{message}</span>
      </div>
      <button 
        onClick={onClose} 
        className="text-neutral-400 hover:text-white transition-colors shrink-0"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
