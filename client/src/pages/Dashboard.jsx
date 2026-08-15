import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { fetchTickets } from '../services/ticketService';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ArrowRight } from 'lucide-react';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const data = await fetchTickets();
        if (data.status === 200 && data.tickets) {
          setTickets(data.tickets);
        }
      } catch (error) {
        console.error("Failed to load tickets", error);
      } finally {
        setLoading(false);
      }
    };
    loadTickets();
  }, []);

  const openTickets = tickets.filter(t => t.status?.toLowerCase() === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status?.toLowerCase() === 'assigned' || t.status?.toLowerCase() === 'in progress').length;
  const resolvedTickets = tickets.filter(t => t.status?.toLowerCase() === 'closed').length;
  
  // Sort descending by created time (assuming tickets have created_at, or just reverse them for now)
  const recentTickets = [...tickets].reverse().slice(0, 4);

  return (
    <div className="flex flex-col gap-6 pb-8 h-full pt-4">
      
      <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-min gap-4 md:gap-6">
        
        {/* Welcome Banner - Span 6 */}
        <GlassCard level={1} className="md:col-span-6 p-6 md:p-8 flex flex-col justify-between min-h-[220px]">
          <div>
            <h3 className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-2">Good Evening</h3>
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-2">{user?.name || 'User'}</h1>
            <p className="text-neutral-400">Your support overview</p>
          </div>
          <div className="mt-8">
            <Button variant="primary" onClick={() => navigate('/create')}>
              + Create Ticket
            </Button>
          </div>
        </GlassCard>

        {/* Open Tickets - Span 3 */}
        <GlassCard level={2} className="md:col-span-3 p-6 flex flex-col justify-between min-h-[220px]">
          <h3 className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Open</h3>
          <div>
            <div className="text-6xl md:text-7xl font-light tracking-tighter text-white mb-1">
              {loading ? '-' : String(openTickets).padStart(2, '0')}
            </div>
            <p className="text-sm text-neutral-500 font-medium">tickets</p>
          </div>
        </GlassCard>

        {/* In Progress - Span 3 */}
        <GlassCard level={2} className="md:col-span-3 p-6 flex flex-col justify-between min-h-[220px]">
          <h3 className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">In Progress</h3>
          <div>
            <div className="text-6xl md:text-7xl font-light tracking-tighter text-white mb-1">
              {loading ? '-' : String(inProgressTickets).padStart(2, '0')}
            </div>
            <p className="text-sm text-neutral-500 font-medium">active</p>
          </div>
        </GlassCard>

        {/* Left Stack (Total & Resolved) - Span 3 */}
        <div className="md:col-span-3 flex flex-col gap-4 md:gap-6">
          <GlassCard level={1} className="flex-1 p-6 flex flex-col justify-between min-h-[160px]">
            <h3 className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Total</h3>
            <div className="text-5xl font-light tracking-tighter text-white mt-4">{loading ? '-' : tickets.length}</div>
          </GlassCard>
          
          <GlassCard level={1} className="flex-1 p-6 flex flex-col justify-between min-h-[160px]">
            <h3 className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Resolved</h3>
            <div className="text-5xl font-light tracking-tighter text-white mt-4">{loading ? '-' : resolvedTickets}</div>
          </GlassCard>
        </div>

        {/* Recent Tickets - Span 9 */}
        <GlassCard level={1} className="md:col-span-9 p-6 flex flex-col min-h-[344px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-semibold tracking-widest text-neutral-500 uppercase">Recent Tickets</h3>
            <button 
              onClick={() => navigate('/tickets')}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 flex flex-col">
            {loading ? (
              <div className="text-neutral-500 text-sm">Loading tickets...</div>
            ) : recentTickets.length === 0 ? (
              <div className="text-neutral-500 text-sm">No recent tickets.</div>
            ) : (
              recentTickets.map((ticket) => (
                <div key={ticket.ticket_id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 py-4 group cursor-pointer border-b border-white/5 last:border-0 hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-medium text-neutral-500">#{String(ticket.ticket_id).slice(-4)}</span>
                      <Badge variant={ticket.priority?.toLowerCase() || 'medium'} className="uppercase text-[8px] px-1.5 py-0">{ticket.priority}</Badge>
                    </div>
                    <h4 className="font-medium text-sm text-neutral-200 group-hover:text-white transition-colors truncate pr-4">{ticket.title}</h4>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-2 md:mt-0 justify-between md:justify-end">
                    <Badge variant={ticket.status?.toLowerCase() === 'open' ? 'open' : 'inProgress'} className="capitalize text-[10px] px-2">
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${ticket.status?.toLowerCase() === 'open' ? 'bg-white' : 'bg-neutral-500'}`}></span>
                      {ticket.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
        
        {/* Ticket Activity - Span 12 */}
        <GlassCard level={1} className="md:col-span-12 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase mb-2">Ticket Activity</h3>
              <p className="text-neutral-300 font-medium">
                {tickets.length} total &middot; {openTickets} open &middot; {resolvedTickets} resolved
              </p>
            </div>
            
            <button 
              onClick={() => navigate('/tickets')}
              className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              View all tickets <ArrowRight className="w-4 h-4" />
            </button>
        </GlassCard>

      </div>
    </div>
  );
}

export default Dashboard;
