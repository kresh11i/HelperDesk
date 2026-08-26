import React from 'react';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import { ArrowRight, ClipboardList } from 'lucide-react';

function AdditionalStats({ recentTickets, loading, onViewAll, onTicketSelect }) {
  const RowSkeleton = () => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 animate-pulse">
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-2.5 w-1/6 bg-white/10 rounded"></div>
        <div className="h-4 w-3/4 bg-white/10 rounded"></div>
      </div>
      <div className="h-5 w-16 bg-white/10 rounded"></div>
    </div>
  );

  return (
    <GlassCard level={1} className="p-6 flex flex-col min-h-[300px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xs font-semibold tracking-widest text-neutral-500 uppercase">Recent Activity</h3>
          <p className="text-[10px] text-neutral-500 mt-0.5">Support tickets logged recently</p>
        </div>
        <button 
          onClick={onViewAll}
          className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
        >
          All Queue <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col gap-3 w-full">
            {[1, 2, 3].map((n) => <RowSkeleton key={n} />)}
          </div>
        ) : recentTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-neutral-500 gap-3">
            <ClipboardList className="w-10 h-10 stroke-[1.2] text-neutral-600" />
            <div>
              <p className="text-xs font-semibold text-white">No active tickets</p>
              <p className="text-[9px] mt-0.5">All support issues resolved.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full justify-start divide-y divide-white/5">
            {recentTickets.map((ticket) => (
              <div 
                key={ticket.ticket_id} 
                onClick={() => onTicketSelect(ticket.ticket_id)}
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-4 group cursor-pointer hover:bg-white/5 rounded-xl px-4 -mx-4 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono text-neutral-500">#{String(ticket.ticket_id).slice(-4)}</span>
                    <Badge variant={ticket.priority?.toLowerCase() || 'medium'} className="uppercase text-[7px] px-1.5 py-0">{ticket.priority}</Badge>
                  </div>
                  <h4 className="font-semibold text-xs text-neutral-200 group-hover:text-blue-300 transition-colors truncate pr-4">{ticket.title}</h4>
                </div>
                
                <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end">
                  <Badge variant={ticket.status?.toLowerCase() === 'open' ? 'open' : (ticket.status?.toLowerCase() === 'closed' || ticket.status?.toLowerCase() === 'resolved' ? 'resolved' : 'inProgress')} className="capitalize text-[9px] px-2 py-0.5">
                    <span className={`w-1 h-1 rounded-full mr-1.5 ${ticket.status?.toLowerCase() === 'open' ? 'bg-white' : 'bg-neutral-500'}`}></span>
                    {ticket.status}
                  </Badge>
                  <span className="text-[9px] text-neutral-500">{new Date(ticket.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export default AdditionalStats;
