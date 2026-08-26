import React from 'react';
import { ArrowLeft, Info } from 'lucide-react';

function ConversationHeader({ customerName, ticketId, createdAt, onBack, onShowDetails }) {
  const initials = customerName ? customerName.substring(0, 2).toUpperCase() : 'CU';

  return (
    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0 select-none">
      <div className="flex items-center gap-3 min-w-0">
        {/* Back Arrow visible on Mobile (onBack provided) */}
        {onBack && (
          <button 
            onClick={onBack}
            className="lg:hidden p-1 -ml-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Back to Queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        {/* Profile Avatar / Indicator */}
        <div 
          onClick={onShowDetails}
          className="relative w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-xs font-bold text-neutral-300 uppercase cursor-pointer"
        >
          {initials}
          {/* Active green status indicator */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-neutral-900 rounded-full"></span>
        </div>

        {/* Text Information (Clickable to view details on mobile/desktop) */}
        <div 
          onClick={onShowDetails}
          className="flex flex-col min-w-0 cursor-pointer"
        >
          <span className="text-xs font-semibold text-white hover:text-blue-300 transition-colors truncate">
            {customerName}
          </span>
          <span className="text-[9px] text-neutral-400 font-medium">
            Ticket #{String(ticketId).slice(-4)} &middot; {new Date(createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Info Icon Button (to open details overlay/drawer) */}
      <button
        onClick={onShowDetails}
        className="p-1.5 rounded-full hover:bg-white/5 text-neutral-400 hover:text-white transition-all cursor-pointer"
        title="View Ticket Details"
      >
        <Info className="w-4 h-4" />
      </button>
    </div>
  );
}

export default ConversationHeader;
