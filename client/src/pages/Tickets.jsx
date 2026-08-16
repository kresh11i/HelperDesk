import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Search, Filter, Plus, Clock, User, ClipboardList, AlertCircle } from 'lucide-react';
import { fetchTickets, assignTicket } from '../services/ticketService';
import { AuthContext } from '../contexts/AuthContext';
import { ToastContext } from '../contexts/ToastContext';

function Tickets() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [queueTab, setQueueTab] = useState('all'); // 'all', 'mine', 'unassigned'
  
  const [sortField, setSortField] = useState('created_at'); // 'title', 'status', 'priority', 'created_at', 'assigned_to'
  const [sortAsc, setSortAsc] = useState(false);
  
  // For the modal state, so we don't apply immediately until "Apply" is clicked
  const [modalPriorityFilter, setModalPriorityFilter] = useState('All');
  const [modalAssigneeFilter, setModalAssigneeFilter] = useState('All');
  
  const filterRef = useRef(null);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const data = await fetchTickets();
        if (data.status === 200 && data.tickets) {
          setTickets(data.tickets);
        } else {
          setError(data.message || 'Failed to retrieve ticket list.');
        }
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
        setError('Failed to fetch tickets. Please check your network connection.');
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
    setPriorityFilter(modalPriorityFilter);
    setAssigneeFilter(modalAssigneeFilter);
    setFilterOpen(false);
  };

  const handleClearFilters = () => {
    setModalPriorityFilter('All');
    setModalAssigneeFilter('All');
    setPriorityFilter('All');
    setAssigneeFilter('All');
    setFilterOpen(false);
  };

  const openFilterModal = () => {
    setModalPriorityFilter(priorityFilter);
    setModalAssigneeFilter(assigneeFilter);
    setFilterOpen(true);
  };

  const handleSelfAssignRow = async (ticketId) => {
    try {
      const data = await assignTicket(ticketId, user.user_id);
      if (data.status === 200) {
        showToast('Ticket claimed successfully!', 'success');
        // Update state locally
        setTickets(prev => prev.map(t => {
          if (t.ticket_id === ticketId) {
            return {
              ...t,
              assigned_to: user.name,
              status: 'Assigned'
            };
          }
          return t;
        }));
      } else {
        showToast(data.message || 'Failed to claim ticket.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred during assignment.', 'error');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'title' || field === 'status' || field === 'assigned_to');
    }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    return sortAsc ? ' ▴' : ' ▾';
  };

  // 1. Role-based scoping: End User (role 3) only sees tickets created by them
  const scopedTickets = user?.role === 3 
    ? tickets.filter(t => t.created_by === user.user_id) 
    : tickets;

  // 2. Tab scoping for Agents / Admins
  const tabScopedTickets = user?.role !== 3 
    ? scopedTickets.filter(t => {
        if (queueTab === 'mine') {
          return t.assigned_to === user?.name;
        }
        if (queueTab === 'unassigned') {
          return !t.assigned_to;
        }
        return true; // 'all'
      })
    : scopedTickets;

  // 3. Search and pills filtering
  const filteredTickets = tabScopedTickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          String(t.ticket_id).toLowerCase().includes(search.toLowerCase());
    
    let matchesStatus = false;
    if (statusFilter === 'All Status') {
      matchesStatus = true;
    } else if (statusFilter.toLowerCase() === 'resolved') {
      matchesStatus = t.status?.toLowerCase() === 'resolved' || t.status?.toLowerCase() === 'closed';
    } else {
      matchesStatus = t.status?.toLowerCase() === statusFilter.toLowerCase();
    }
    
    const matchesPriority = priorityFilter === 'All' || t.priority?.toLowerCase() === priorityFilter.toLowerCase();
    
    let matchesAssignee = false;
    if (assigneeFilter === 'All') {
      matchesAssignee = true;
    } else if (assigneeFilter === 'Unassigned') {
      matchesAssignee = !t.assigned_to;
    } else {
      matchesAssignee = t.assigned_to === assigneeFilter;
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  // 4. Sort tickets
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';

    if (sortField === 'created_at') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const statusPills = ['All Status', 'Open', 'In Progress', 'Resolved', 'Closed'];
  const priorityPills = ['High', 'Medium', 'Low'];

  const RowSkeleton = () => (
    <tr className="animate-pulse border-b border-white/5">
      <td className="p-4">
        <div className="h-2 w-12 bg-white/10 rounded mb-2"></div>
        <div className="h-4 w-48 bg-white/10 rounded"></div>
      </td>
      <td className="p-4"><div className="h-6 w-16 bg-white/10 rounded"></div></td>
      <td className="p-4"><div className="h-6 w-12 bg-white/10 rounded"></div></td>
      <td className="p-4"><div className="h-4 w-20 bg-white/10 rounded"></div></td>
      <td className="p-4"><div className="h-4 w-24 bg-white/10 rounded"></div></td>
      <td className="p-4"><div className="h-4 w-16 bg-white/10 rounded"></div></td>
      <td className="p-4 text-right"><div className="h-4 w-8 bg-white/10 rounded ml-auto"></div></td>
    </tr>
  );

  return (
    <div className="flex flex-col gap-6 pb-8 h-full pt-4 max-w-5xl mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Tickets</h1>
          <p className="text-sm text-neutral-400">Manage and track support requests.</p>
        </div>
        {user?.role === 3 && (
          <Button variant="primary" className="flex items-center gap-2 self-start md:self-auto" onClick={() => navigate('/create')}>
            <Plus className="w-4 h-4" /> Create Ticket
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
      
      {/* Search and Filter Button */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text"
            placeholder="Search by ID or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors w-full shadow-inner"
          />
        </div>
        
        <div className="relative" ref={filterRef}>
          <button 
            onClick={openFilterModal}
            className={`px-4 py-3 rounded-xl border flex items-center gap-2 text-sm font-medium transition-colors ${
              priorityFilter !== 'All' || assigneeFilter !== 'All' 
                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
            }`}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
          
          {filterOpen && (
            <GlassCard level={3} className="absolute right-0 top-14 w-72 p-5 flex flex-col gap-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Advanced Filters</h3>
                <button onClick={() => setFilterOpen(false)} className="text-neutral-500 hover:text-white">✕</button>
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

              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Assignee</span>
                <div className="flex flex-col gap-2">
                  {['All', 'Unassigned', 'Demo Agent'].map(assignee => (
                    <label key={assignee} className="flex items-center gap-3 text-sm text-neutral-300 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="assignee"
                        checked={modalAssigneeFilter === assignee}
                        onChange={() => setModalAssigneeFilter(assignee)}
                        className="w-4 h-4 accent-white bg-white/10 border-white/20"
                      />
                      <span className="group-hover:text-white transition-colors">{assignee}</span>
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

      {/* Queue Tabs (Admins/Agents only) */}
      {user?.role !== 3 && (
        <div className="flex gap-2 border-b border-white/5 pb-px">
          <button 
            onClick={() => setQueueTab('all')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-all ${
              queueTab === 'all' 
                ? 'border-white text-white' 
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            All Tickets ({scopedTickets.length})
          </button>
          <button 
            onClick={() => setQueueTab('mine')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-all ${
              queueTab === 'mine' 
                ? 'border-white text-white' 
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            My Tickets ({scopedTickets.filter(t => t.assigned_to === user?.name).length})
          </button>
          <button 
            onClick={() => setQueueTab('unassigned')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-all ${
              queueTab === 'unassigned' 
                ? 'border-white text-white' 
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Unassigned ({scopedTickets.filter(t => !t.assigned_to).length})
          </button>
        </div>
      )}

      {/* Pill Quick Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide border-b border-white/5">
        {statusPills.map(status => (
          <button 
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
              statusFilter === status 
                ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.15)]' 
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
                ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.15)]' 
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
              <tr className="border-b border-white/10 text-[9px] font-semibold tracking-widest text-neutral-500 uppercase select-none">
                <th onClick={() => handleSort('title')} className="p-4 font-semibold cursor-pointer hover:text-white transition-colors">Ticket{renderSortIndicator('title')}</th>
                <th onClick={() => handleSort('status')} className="p-4 font-semibold cursor-pointer hover:text-white transition-colors">Status{renderSortIndicator('status')}</th>
                <th onClick={() => handleSort('priority')} className="p-4 font-semibold cursor-pointer hover:text-white transition-colors">Priority{renderSortIndicator('priority')}</th>
                <th className="p-4 font-semibold">Created By</th>
                <th onClick={() => handleSort('assigned_to')} className="p-4 font-semibold cursor-pointer hover:text-white transition-colors">Assigned To{renderSortIndicator('assigned_to')}</th>
                <th onClick={() => handleSort('created_at')} className="p-4 font-semibold cursor-pointer hover:text-white transition-colors">Created{renderSortIndicator('created_at')}</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4].map(n => <RowSkeleton key={n} />)
              ) : sortedTickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-sm text-neutral-500">
                    <div className="flex flex-col items-center gap-3">
                      <ClipboardList className="w-12 h-12 stroke-[1.2] text-neutral-600" />
                      <div>
                        <p className="font-semibold text-white">No tickets found</p>
                        <p className="text-xs mt-1">There are no tickets matching your active search or filters.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedTickets.map((ticket) => (
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
                      <Badge variant={ticket.status?.toLowerCase() === 'open' ? 'open' : (ticket.status?.toLowerCase() === 'closed' || ticket.status?.toLowerCase() === 'resolved' ? 'resolved' : 'inProgress')} className="capitalize text-[10px] px-2 py-1 shadow-sm">
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${ticket.status?.toLowerCase() === 'open' ? 'bg-white' : 'bg-neutral-500'}`}></span>
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase bg-white/5 text-neutral-300 border border-white/10">
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-neutral-300">
                      {ticket.created_user?.name || 'Internal User'}
                    </td>
                    <td className="p-4 text-sm text-neutral-400">
                      {ticket.assigned_to ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-white/10 text-[9px] font-bold flex items-center justify-center border border-white/5 text-neutral-300 uppercase shrink-0">
                            {ticket.assigned_to.substring(0, 2)}
                          </div>
                          <span>{ticket.assigned_to}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-600">—</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-neutral-500 whitespace-nowrap">
                      {new Date(ticket.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {user?.role === 2 && !ticket.assigned_to ? (
                        <button 
                          onClick={() => handleSelfAssignRow(ticket.ticket_id)}
                          className="px-3 py-1 bg-white hover:bg-neutral-200 text-black text-xs font-semibold rounded-lg transition-all shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:scale-105"
                        >
                          Claim
                        </button>
                      ) : (
                        <span 
                          onClick={() => navigate(`/tickets/${ticket.ticket_id}`)} 
                          className="text-xs text-neutral-500 group-hover:text-white transition-colors flex items-center justify-end gap-1 cursor-pointer"
                        >
                          View <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                        </span>
                      )}
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
