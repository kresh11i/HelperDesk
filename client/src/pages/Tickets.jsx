import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import { Search, Filter, Plus, ChevronDown, Clock, User } from 'lucide-react';
import { fetchTickets } from '../services/ticketService';

function Tickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All');
  
  // For the modal state, so we don't apply immediately until "Apply" is clicked
  const [modalStatusFilter, setModalStatusFilter] = useState('All Status');
  const [modalPriorityFilter, setModalPriorityFilter] = useState('All');
  
  const filterRef = useRef(null);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const data = await fetchTickets();
        if (data.status === 200 && data.tickets) {
          setTickets([...data.tickets].reverse());
        }
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTickets();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApplyFilters = () => {
    setStatusFilter(modalStatusFilter);
    setPriorityFilter(modalPriorityFilter);
    setFilterOpen(false);
  };

  const handleClearFilters = () => {
    setModalStatusFilter('All Status');
    setModalPriorityFilter('All');
    setStatusFilter('All Status');
    setPriorityFilter('All');
    setFilterOpen(false);
  };

  const openFilterModal = () => {
    setModalStatusFilter(statusFilter);
    setModalPriorityFilter(priorityFilter);
    setFilterOpen(true);
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || String(t.ticket_id).includes(search);
    const matchesStatus = statusFilter === 'All Status' || t.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === 'All' || t.priority?.toLowerCase() === priorityFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const statusPills = ['All Status', 'Open', 'In Progress', 'Resolved', 'Closed'];
  const priorityPills = ['High', 'Medium', 'Low'];

  return (
    <div className="flex flex-col gap-6 pb-8 h-full pt-4 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-2">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Tickets</h1>
        <p className="text-sm text-neutral-400">Manage and track support requests.</p>
      </div>
      
      {/* Search and Filter Button */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors w-full shadow-inner"
          />
        </div>
        
        <div className="relative" ref={filterRef}>
          <button 
            onClick={openFilterModal}
            className={`px-4 py-3 rounded-xl border flex items-center gap-2 text-sm font-medium transition-colors ${
              statusFilter !== 'All Status' || priorityFilter !== 'All' 
                ? 'bg-white text-black border-white' 
                : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
            }`}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
          
          {filterOpen && (
            <GlassCard level={3} className="absolute right-0 top-14 w-72 p-5 flex flex-col gap-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Filters</h3>
                <button onClick={() => setFilterOpen(false)} className="text-neutral-500 hover:text-white">✕</button>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Status</span>
                <div className="flex flex-col gap-2">
                  {statusPills.map(status => (
                    <label key={status} className="flex items-center gap-3 text-sm text-neutral-300 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="status"
                        checked={modalStatusFilter === status}
                        onChange={() => setModalStatusFilter(status)}
                        className="w-4 h-4 accent-white bg-white/10 border-white/20"
                      />
                      <span className="group-hover:text-white transition-colors">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Priority</span>
                <div className="flex flex-col gap-2">
                  {['All', ...priorityPills].map(priority => (
                    <label key={priority} className="flex items-center gap-3 text-sm text-neutral-300 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="priority"
                        checked={modalPriorityFilter === priority}
                        onChange={() => setModalPriorityFilter(priority)}
                        className="w-4 h-4 accent-white bg-white/10 border-white/20"
                      />
                      <span className="group-hover:text-white transition-colors">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/10">
                <button onClick={handleClearFilters} className="text-xs font-medium text-neutral-400 hover:text-white">Clear</button>
                <button onClick={handleApplyFilters} className="text-xs font-semibold bg-white text-black px-4 py-1.5 rounded-lg hover:bg-neutral-200">Apply</button>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Pill Quick Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide border-b border-white/5">
        {statusPills.map(status => (
          <button 
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
              statusFilter === status 
                ? 'bg-white text-black border-white' 
                : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-neutral-200'
            }`}
          >
            {status}
          </button>
        ))}
        <div className="w-px h-6 bg-white/10 mx-1 shrink-0"></div>
        {priorityPills.map(priority => (
          <button 
            key={priority}
            onClick={() => setPriorityFilter(priorityFilter === priority ? 'All' : priority)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
              priorityFilter === priority 
                ? 'bg-white text-black border-white' 
                : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-neutral-200'
            }`}
          >
            {priority}
          </button>
        ))}
      </div>

      {/* Table View */}
      <GlassCard level={1} className="overflow-hidden mt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[9px] font-semibold tracking-widest text-neutral-500 uppercase">
                <th className="p-4 font-semibold">Ticket</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Priority</th>
                <th className="p-4 font-semibold">Created By</th>
                <th className="p-4 font-semibold">Assigned To</th>
                <th className="p-4 font-semibold">Updated</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-sm text-neutral-500">Loading tickets...</td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-sm text-neutral-500">No tickets found matching your criteria.</td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket.ticket_id} 
                    onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-500 mb-0.5">#{String(ticket.ticket_id).slice(-4)}</span>
                        <span className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors line-clamp-1">{ticket.title}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={ticket.status?.toLowerCase() === 'open' ? 'open' : (ticket.status?.toLowerCase() === 'closed' ? 'resolved' : 'inProgress')} className="capitalize text-[10px] px-2 py-1 shadow-sm">
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${ticket.status?.toLowerCase() === 'open' ? 'bg-white' : 'bg-neutral-500'}`}></span>
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase bg-white/5 text-neutral-300 border border-white/10">
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-neutral-300">Internal User</td>
                    <td className="p-4 text-sm text-neutral-400">{ticket.assigned_to || '—'}</td>
                    <td className="p-4 text-sm text-neutral-500 whitespace-nowrap">
                      {new Date(ticket.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-xs text-neutral-500 group-hover:text-white transition-colors flex items-center justify-end gap-1">
                        View <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

    </div>
  );
}

export default Tickets;
