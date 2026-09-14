
const Badge = ({ children, variant = 'default', className = '' }) => {
  const neutralStyle = 'bg-white/10 text-white border border-white/20';

  const variants = {
    default: neutralStyle,
    high: 'bg-white/5 border border-transparent text-[#F87171] font-semibold',
    medium: 'bg-white/5 border border-transparent text-[#FBBF24] font-semibold',
    low: 'bg-white/5 border border-transparent text-[#86EFAC] font-semibold',
    open: neutralStyle,
    inProgress: neutralStyle,
    resolved: neutralStyle,
    closed: neutralStyle,
    assigned: neutralStyle
  };

  const selectedVariant = variants[variant] || variants.default;

  const checkStatus = (str) => {
    if (!str) return null;
    const s = str.toLowerCase().trim();
    if (s === 'open') return 'bg-[#34D399]';
    if (s === 'in progress') return 'bg-[#60A5FA]';
    if (s === 'resolved') return 'bg-[#C084FC]';
    if (s === 'closed') return 'bg-[#94A3B8]';
    if (s === 'assigned') return 'bg-[#FBBF24]';
    return null;
  };

  let dotColor = null;
  let cleanChildren = children;

  if (typeof children === 'string') {
    dotColor = checkStatus(children);
  } else if (Array.isArray(children)) {
    const textChild = children.find(c => typeof c === 'string');
    if (textChild) {
      dotColor = checkStatus(textChild);
      if (dotColor) {
        cleanChildren = children.filter(c => {
          if (typeof c === 'string') return true;
          if (c && c.props && typeof c.props.className === 'string' && c.props.className.includes('rounded-full')) return false;
          return true;
        });
      }
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs tracking-wide ${selectedVariant} ${className}`}>
      {dotColor && <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${dotColor}`}></span>}
      {cleanChildren}
    </span>
  );
};

export default Badge;
