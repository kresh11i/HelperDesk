
const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-white/10 text-white border border-white/20',
    high: 'bg-red-500/10 text-red-400 border border-red-500/20 font-semibold',
    medium: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    low: 'bg-white/5 text-neutral-300 border border-white/10',
    open: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    inProgress: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium',
    closed: 'bg-white/5 text-neutral-500 border border-white/10'
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs tracking-wide ${selectedVariant} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
