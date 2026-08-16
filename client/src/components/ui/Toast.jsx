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
      bg: 'bg-green-500/10 border-green-500/20 text-green-400',
      icon: CheckCircle,
      glow: 'shadow-[0_0_15px_rgba(34,197,94,0.15)]',
    },
    error: {
      bg: 'bg-red-500/10 border-red-500/20 text-red-400',
      icon: AlertCircle,
      glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    },
    info: {
      bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      icon: Info,
      glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    },
  };

  const { bg, icon: Icon, glow } = config[type] || config.success;

  return (
    <div 
      className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-right-4 duration-300 ${bg} ${glow} w-full`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">{message}</span>
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
