import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { fetchTicketById, updateTicketStatus, assignTicket } from '../services/ticketService';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ArrowLeft, Clock, User, CheckCircle, MessageSquare } from 'lucide-react';

function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadTicket = async () => {
      try {
        const data = await fetchTicketById(id);
        if (data.status === 200 && data.ticket) {
          setTicket(data.ticket);
        } else {
          setTicket(null); // Not found
        }
      } catch (error) {
        console.error("Failed to load ticket:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTicket();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const data = await updateTicketStatus(id, newStatus, ticket.status, user?.role);
      if (data.status === 200 && data.data) {
        setTicket(data.data);
      } else {
        setTicket({ ...ticket, status: newStatus });
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async () => {
    setUpdating(true);
    try {
      const data = await assignTicket(id, user.user_id);
      if (data.status === 200 && data.ticket) {
        setTicket(data.ticket);
      } else {
        setTicket({ ...ticket, assigned_to: user.name, status: 'assigned' });
      }
    } catch (error) {
      console.error("Failed to assign ticket:", error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center text-neutral-400">Loading ticket...</div>;
  }

  if (!ticket) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-neutral-400 gap-4">
        <p>Ticket not found.</p>
        <Button variant="secondary" onClick={() => navigate('/tickets')}>Back to Queue</Button>
      </div>
    );
  }

  // RBAC checks
  const isAdmin = user?.role === 1;
  const isAgent = user?.role === 2;
  const canManageTicket = isAdmin || isAgent;
  
  return (
    <div className="flex flex-col gap-6 pb-8 h-full max-w-5xl mx-auto w-full pt-4 md:pt-8">
      
      <button 
        onClick={() => navigate('/tickets')}
        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors self-start"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Queue
      </button>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6">
          <GlassCard level={1} className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-neutral-400">#{String(ticket.ticket_id).slice(-4)}</span>
                  <Badge variant={ticket.priority?.toLowerCase() || 'medium'} className="capitalize">{ticket.priority}</Badge>
                  <Badge variant={ticket.status?.toLowerCase() === 'open' ? 'open' : (ticket.status?.toLowerCase() === 'closed' || ticket.status?.toLowerCase() === 'resolved' ? 'resolved' : 'inProgress')} className="capitalize">
                    {ticket.status}
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">{ticket.title}</h1>
              </div>
            </div>
            
            <div className="text-neutral-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
              {ticket.description || "No detailed description provided for this ticket. It was created from a mock template or quick submit form."}
            </div>
          </GlassCard>

          {/* Activity/Comments Placeholder */}
          <h3 className="text-sm font-semibold tracking-widest text-neutral-500 uppercase mt-4 mb-2">Activity</h3>
          <GlassCard level={2} className="p-6 flex flex-col gap-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">System</span>
                  <span className="text-xs text-neutral-500">{new Date(ticket.created_at || Date.now()).toLocaleString()}</span>
                </div>
                <p className="text-sm text-neutral-400">Ticket created.</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10">
              <textarea 
                rows={3}
                placeholder="Add a comment or update..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors resize-none mb-3"
              />
              <div className="flex justify-end">
                <Button variant="secondary" className="text-xs px-4 py-1.5"><MessageSquare className="w-3 h-3 mr-2 inline" /> Post Update</Button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar Details Area */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          <GlassCard level={2} className="p-6 flex flex-col gap-6">
            
            {/* Status Manager (Admins/Agents) */}
            {canManageTicket && (
              <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
                <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Manage Status</span>
                <div className="flex flex-col gap-2 mt-2">
                  <select 
                    value={ticket.status?.toLowerCase() === 'resolved' ? 'closed' : ticket.status?.toLowerCase()} 
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updating}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 capitalize"
                  >
                    <option value="open" className="bg-neutral-900">Open</option>
                    <option value="assigned" className="bg-neutral-900">Assigned</option>
                    <option value="in progress" className="bg-neutral-900">In Progress</option>
                    <option value="closed" className="bg-neutral-900">Closed (Resolved)</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase block mb-1">Assignee</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-white">{ticket.assigned_to || 'Unassigned'}</span>
                  </div>
                  {canManageTicket && !ticket.assigned_to && (
                    <button 
                      onClick={handleAssign}
                      disabled={updating}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Assign to me
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase block mb-1">Requester</span>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm text-white">Internal User</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase block mb-1">Created</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm text-white">{new Date(ticket.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default TicketDetails;
