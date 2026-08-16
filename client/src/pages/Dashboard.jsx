import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { fetchTickets } from '../services/ticketService';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ArrowRight, AlertCircle, ClipboardList } from 'lucide-react';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const data = await fetchTickets();
        if (data.status === 200 && data.tickets) {
          setTickets(data.tickets);
        } else {
          setError(data.message || 'Failed to retrieve tickets.');
        }
      } catch (error) {
        console.error("Failed to load tickets", error);
        setError('Error fetching tickets. Please check your network connection.');
      } finally {
        setLoading(false);
      }
    };
    loadTickets();
  }, []);

  // Filter tickets by creator if role is End User (3)
  const userTickets = user?.role === 3 
    ? tickets.filter(t => t.created_by === user.user_id) 
    : tickets;

  const openTickets = userTickets.filter(t => {
    const status = t.status?.toLowerCase();
    return status === 'open' || status === 'reopened';
  }).length;

  const inProgressTickets = userTickets.filter(t => {
    const status = t.status?.toLowerCase();
    return status === 'assigned' || status === 'in progress';
  }).length;

  const resolvedTickets = userTickets.filter(t => {
    const status = t.status?.toLowerCase();
    return status === 'closed' || status === 'resolved';
  }).length;

  const myTicketsCount = tickets.filter(t => t.assigned_to === user?.name).length;
  
  // Sort descending by created time
  const recentTickets = [...userTickets].reverse().slice(0, 4);

  // Skeletons
  const MetricsSkeleton = () => (
    <div className="animate-pulse flex flex-col justify-between h-full min-h-[140px]">
      <div className="h-2 w-1/3 bg-white/10 rounded"></div>
      <div className="h-12 w-1/2 bg-white/10 rounded mt-4"></div>
      <div className="h-2 w-1/4 bg-white/10 rounded mt-2"></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pb-8 h-full pt-4">
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-min gap-4 md:gap-6">
        
        {/* Welcome Banner */}
        <GlassCard level={1} className="md:col-span-6 p-6 md:p-8 flex flex-col justify-between min-h-[220px]">
          <div>
            <h3 className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-2">
              {user?.role === 1 ? 'Admin Panel' : user?.role === 2 ? 'Agent Workspace' : 'Customer Portal'}
            </h3>
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-2 truncate">{user?.name || 'User'}</h1>
            <p className="text-neutral-400 text-sm max-w-sm leading-relaxed">
              {user?.role === 1 
                ? 'Manage tickets, track agent workloads, and view organization statistics.' 
                : user?.role === 2 
                  ? `You have ${myTicketsCount} ticket${myTicketsCount !== 1 ? 's' : ''} assigned to you.`
                  : 'Submit new issues or track the status of your existing requests.'}
            </p>
          </div>
          <div className="mt-8">
            {user?.role === 3 ? (
              <Button variant="primary" onClick={() => navigate('/create')}>
                + Create Ticket
              </Button>
            ) : (
              <Button variant="primary" onClick={() => navigate('/tickets')}>
                View Ticket Queue
              </Button>
            )}
          </div>
        </GlassCard>

        {/* Open Tickets */}
        <GlassCard level={2} className="md:col-span-3 p-6 flex flex-col justify-between min-h-[220px]">
          <h3 className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Open / Reopened</h3>
          <div>
            {loading ? (
              <MetricsSkeleton />
            ) : (
              <>
                <div className="text-6xl md:text-7xl font-light tracking-tighter text-white mb-1">
                  {String(openTickets).padStart(2, '0')}
                </div>
                <p className="text-sm text-neutral-500 font-medium">tickets</p>
              </>
            )}
          </div>
        </GlassCard>

        {/* In Progress */}
        <GlassCard level={2} className="md:col-span-3 p-6 flex flex-col justify-between min-h-[220px]">
          <h3 className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Active Progress</h3>
          <div>
            {loading ? (
              <MetricsSkeleton />
            ) : (
              <>
                <div className="text-6xl md:text-7xl font-light tracking-tighter text-white mb-1">
                  {String(inProgressTickets).padStart(2, '0')}
                </div>
                <p className="text-sm text-neutral-500 font-medium">active</p>
              </>
            )}
          </div>
        </GlassCard>

        {/* Total & Resolved Stack */}
        <div className="md:col-span-3 flex flex-col gap-4 md:gap-6 justify-between">
          <GlassCard level={1} className="flex-1 p-6 flex flex-col justify-between min-h-[100px]">
            <h3 className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Total</h3>
            {loading ? (
              <div className="h-6 w-1/3 bg-white/10 rounded animate-pulse mt-2"></div>
            ) : (
              <div className="text-4xl font-light tracking-tighter text-white mt-2">{userTickets.length}</div>
            )}
          </GlassCard>
          
          <GlassCard level={1} className="flex-1 p-6 flex flex-col justify-between min-h-[100px]">
            <h3 className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Resolved</h3>
            {loading ? (
              <div className="h-6 w-1/3 bg-white/10 rounded animate-pulse mt-2"></div>
            ) : (
              <div className="text-4xl font-light tracking-tighter text-white mt-2">{resolvedTickets}</div>
            )}
          </GlassCard>
        </div>

        {/* Recent Tickets */}
        <GlassCard level={1} className="md:col-span-9 p-6 flex flex-col min-h-[344px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-semibold tracking-widest text-neutral-500 uppercase">Recent Tickets</h3>
            <button 
              onClick={() => navigate('/tickets')}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              All Queue <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="flex flex-col gap-4 w-full animate-pulse">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-2 w-1/6 bg-white/10 rounded"></div>
                      <div className="h-4 w-3/4 bg-white/10 rounded"></div>
                    </div>
                    <div className="h-6 w-16 bg-white/10 rounded"></div>
                  </div>
                ))}
              </div>
            ) : recentTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-neutral-500 gap-3">
                <ClipboardList className="w-12 h-12 stroke-[1.5]" />
                <div>
                  <p className="text-sm font-semibold text-white">No active tickets</p>
                  <p className="text-xs">
                    {user?.role === 3 
                      ? "You haven't created any support tickets yet." 
                      : 'No tickets are currently logged for your organization.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full justify-start">
                {recentTickets.map((ticket) => (
                  <div 
                    key={ticket.ticket_id} 
                    onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
                    className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 py-4 group cursor-pointer border-b border-white/5 last:border-0 hover:bg-white/5 rounded-lg px-3 -mx-3 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-medium text-neutral-500">#{String(ticket.ticket_id).slice(-4)}</span>
                        <Badge variant={ticket.priority?.toLowerCase() || 'medium'} className="uppercase text-[8px] px-1.5 py-0">{ticket.priority}</Badge>
                      </div>
                      <h4 className="font-medium text-sm text-neutral-200 group-hover:text-blue-300 transition-colors truncate pr-4">{ticket.title}</h4>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2 md:mt-0 justify-between md:justify-end shrink-0">
                      <Badge variant={ticket.status?.toLowerCase() === 'open' ? 'open' : (ticket.status?.toLowerCase() === 'closed' || ticket.status?.toLowerCase() === 'resolved' ? 'resolved' : 'inProgress')} className="capitalize text-[10px] px-2.5 py-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${ticket.status?.toLowerCase() === 'open' ? 'bg-white' : 'bg-neutral-500'}`}></span>
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
        
        {/* Ticket Activity Footer */}
        <GlassCard level={1} className="md:col-span-12 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase mb-2">Ticket Activity Summary</h3>
              <p className="text-neutral-300 font-medium text-sm">
                {userTickets.length} total &middot; {openTickets} open &middot; {resolvedTickets} resolved
              </p>
            </div>
            
            <button 
              onClick={() => navigate('/tickets')}
              className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              View entire queue <ArrowRight className="w-4 h-4" />
            </button>
        </GlassCard>

      </div>
    </div>
  );
}

export default Dashboard;
