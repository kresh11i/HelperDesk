import { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { motion } from 'framer-motion';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3800);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: {
      bg: 'bg-[#111111]/95 border-white/10 text-white',
      iconColor: 'text-[#34D399]',
      icon: CheckCircle,
      glow: 'shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
    },
    error: {
      bg: 'bg-[#111111]/95 border-white/10 text-white',
      iconColor: 'text-[#F87171]',
      icon: AlertCircle,
      glow: 'shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
    },
    info: {
      bg: 'bg-[#111111]/95 border-white/10 text-white',
      iconColor: 'text-[#60A5FA]',
      icon: Info,
      glow: 'shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
    },
  };

  const { bg, iconColor, icon: Icon, glow } = config[type] || config.success;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 30,
        opacity: { duration: 0.2 } 
      }}
      className={`pointer-events-auto flex items-center justify-between gap-4 py-3.5 px-5 rounded-full border backdrop-blur-xl ${bg} ${glow} w-auto max-w-[90vw] md:max-w-md origin-top`}
      role="alert"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
        <span className="text-[14.5px] font-medium leading-tight whitespace-normal break-words">{message}</span>
      </div>
      <button 
        onClick={onClose} 
        className="text-neutral-500 hover:text-white transition-colors shrink-0 ml-2"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default Toast;
