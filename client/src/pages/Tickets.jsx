import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import {
  Search,
  Filter,
  Plus,
  Clock,
  User,
  ClipboardList,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Edit,
  Trash2,
  X,
  Send,
  Lock,
  CheckCircle2,
  Play,
  RotateCcw,
  Paperclip,
  CheckCheck
} from 'lucide-react';
import {
  fetchTickets,
  fetchTicketById,
  updateTicketStatus,
  assignTicket,
  updateTicket,
  deleteTicket,
  fetchComments,
  createComment,
  fetchAgents
} from '../services/ticketService';
import { AuthContext } from '../contexts/AuthContext';
import { ToastContext } from '../contexts/ToastContext';

function Tickets() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  
  // Queue States
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [queueTab, setQueueTab] = useState('all'); // 'all', 'mine', 'unassigned'
  
  const [sortField, setSortField] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  
  const [modalPriorityFilter, setModalPriorityFilter] = useState('All');
  const [modalAssigneeFilter, setModalAssigneeFilter] = useState('All');
  
  const filterRef = useRef(null);

  // Selected Ticket & Chat States
  const [ticket, setTicket] = useState(null);
  const [chatTicketLoading, setChatTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  
  const commentsEndRef = useRef(null);

  // Fetch Tickets on Mount
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

  useEffect(() => {
    loadTickets();
  }, []);

  // Fetch Selected Ticket details & comments when id changes
  const loadSelectedTicket = async () => {
    if (!id) {
      setTicket(null);
      setComments([]);
      return;
    }
    setChatTicketLoading(true);
    setTicketError(null);
    try {
      const data = await fetchTicketById(id);
      if (data.status === 200 && data.ticket) {
        setTicket(data.ticket);
        setEditTitle(data.ticket.title || '');
        setEditDescription(data.ticket.description || '');
        setEditPriority(data.ticket.priority || 'Medium');
      } else if (data.status === 403) {
        setTicketError("You do not have permission to view this ticket.");
      } else if (data.status === 404) {
        setTicketError("Ticket not found.");
      } else {
        setTicketError(data.message || "Failed to load ticket details.");
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        setTicketError("You do not have permission to view this ticket.");
      } else {
        setTicketError(err.response?.data?.message || "Failed to load ticket details.");
      }
    } finally {
      setChatTicketLoading(false);
    }
  };

  const loadSelectedComments = async () => {
    if (!id) return;
    setCommentsLoading(true);
    try {
      const data = await fetchComments(id);
      if (data.status === 200 && data.comments) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    loadSelectedTicket();
    loadSelectedComments();
  }, [id]);

  // Load Agents list for Admin assignment dropdown
  useEffect(() => {
    if (user?.role === 1) {
      const loadAgentsList = async () => {
        try {
          const result = await fetchAgents();
          if (result.status === 200 && result.agents) {
            setAgents(result.agents);
          }
        } catch (err) {
          console.error("Failed to fetch agents:", err);
        }
      };
      loadAgentsList();
    }
  }, [user]);

  // Scroll to bottom of chat comments
  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (comments.length > 0) {
      scrollToBottom();
    }
  }, [comments]);

  // Handle outside click for filter modal
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
        loadTickets(); // Reload list
      } else {
        showToast(data.message || 'Failed to claim ticket.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred during assignment.', 'error');
    }
  };

  // Selected Ticket Handlers
  const handleStatusTransition = async (nextStatus) => {
    setUpdating(true);
    try {
      const data = await updateTicketStatus(id, nextStatus, ticket.status, user?.role);
      if (data.status === 200) {
        showToast(`Status updated to ${nextStatus}.`, "success");
        await loadSelectedTicket();
        loadTickets(); // Reload list
      } else {
        showToast(data.message || "Status transition denied.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || "Error executing status transition.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleSelfAssign = async () => {
    setUpdating(true);
    try {
      const data = await assignTicket(id, user.user_id);
      if (data.status === 200) {
        showToast("Ticket assigned to you.", "success");
        await loadSelectedTicket();
        loadTickets(); // Reload list
      } else {
        showToast(data.message || "Failed to claim ticket.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Error claiming ticket.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleAdminAssign = async (agentId) => {
    setUpdating(true);
    try {
      const data = await assignTicket(id, agentId);
      if (data.status === 200) {
        showToast("Ticket assigned successfully.", "success");
        await loadSelectedTicket();
        loadTickets(); // Reload list
      } else {
        showToast(data.message || "Failed to assign ticket.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Error assigning ticket.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!editTitle.trim() || !editDescription.trim()) {
      showToast("Title and Description are required.", "error");
      return;
    }
    setUpdating(true);
    try {
      const result = await updateTicket(id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority
      });
      if (result.status === 200 && result.ticket) {
        setTicket(result.ticket);
        setIsEditing(false);
        showToast("Ticket details saved.", "success");
        loadTickets(); // Reload list
      } else {
        showToast(result.message || "Failed to save changes.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating ticket.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      setUpdating(true);
      try {
        const result = await deleteTicket(id);
        if (result.status === 200) {
          showToast("Ticket deleted successfully.", "success");
          navigate("/tickets");
          loadTickets(); // Reload list
        } else {
          showToast(result.message || "Failed to delete ticket.", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Error deleting ticket.", "error");
      } finally {
        setUpdating(false);
      }
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const textToSubmit = commentText.trim();
    setCommentText("");

    const tempId = Math.random().toString(36).substring(2, 9);
    const optimisticMessage = {
      comment_id: tempId,
      comment: textToSubmit,
      created_at: new Date().toISOString(),
      user_id: user.user_id,
      user: {
        name: user.name,
        role: user.role
      },
      isOptimistic: true
    };

    setComments((prev) => [...prev, optimisticMessage]);

    try {
      const result = await createComment(id, textToSubmit);
      if (result.status === 201 && result.comment) {
        setComments((prev) =>
          prev.map((c) => (c.comment_id === tempId ? result.comment : c))
        );
      } else {
        showToast(result.message || "Failed to send comment.", "error");
        setComments((prev) => prev.filter((c) => c.comment_id !== tempId));
      }
    } catch (err) {
      console.error(err);
      showToast("Error posting comment.", "error");
      setComments((prev) => prev.filter((c) => c.comment_id !== tempId));
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

  // RBAC checks for selected ticket
  const isAdmin = user?.role === 1;
  const isAgent = user?.role === 2;
  const isEndUser = user?.role === 3;
  const isAssignedToMe = ticket && ticket.assigned_to === user?.name;
  const isCreatorOfTicket = ticket && ticket.created_by === user?.user_id;

  const canManageStatus = isAdmin || (isAgent && isAssignedToMe);
  const canEditTicket = isAdmin || (isAgent && isAssignedToMe);
  const canDeleteTicket = isAdmin;
  const canComment = isAdmin || (isAgent && isAssignedToMe) || (isEndUser && isCreatorOfTicket);

  const allowedTransitions = {
    Open: ["Assigned"],
    Assigned: ["In Progress"],
    "In Progress": ["Resolved"],
    Resolved: ["Closed", "Reopened"],
    Closed: [],
    Reopened: ["In Progress"]
  };

  const sortedComments = [...comments].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateA - dateB;
  });

  const getRoleName = (roleNum) => {
    if (roleNum === 1) return "Admin";
    if (roleNum === 2) return "Agent";
    return "Customer";
  };

  // Scoped list filtering
  const scopedTickets = user?.role === 3 
    ? tickets.filter(t => t.created_by === user.user_id) 
    : tickets;

  const tabScopedTickets = user?.role !== 3 
    ? scopedTickets.filter(t => {
        if (queueTab === 'mine') {
          return t.assigned_to === user?.name;
        }
        if (queueTab === 'unassigned') {
          return !t.assigned_to;
        }
        return true;
      })
    : scopedTickets;

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
      {!id && <td className="p-4"><div className="h-4 w-20 bg-white/10 rounded"></div></td>}
      {!id && <td className="p-4"><div className="h-4 w-24 bg-white/10 rounded"></div></td>}
      {!id && <td className="p-4"><div className="h-4 w-16 bg-white/10 rounded"></div></td>}
      <td className="p-4 text-right"><div className="h-4 w-8 bg-white/10 rounded ml-auto"></div></td>
    </tr>
  );

  const creatorName = ticket?.created_by === user?.user_id ? user?.name : (ticket?.created_user?.name || "Customer");
  const nextTransitions = ticket ? (allowedTransitions[ticket.status] || []) : [];
  const validTransitions = nextTransitions.filter((state) => {
    if (state === "Closed" || state === "Reopened") {
      return isAdmin;
    }
    return true;
  });

  // RENDER SPLIT PANE OR FULL-WIDTH LAYOUT
  return (
    <div className={`w-full text-white ${id ? "flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] min-h-[600px] overflow-hidden" : "flex flex-col gap-6 pb-8 h-full pt-4 max-w-5xl mx-auto w-full animate-fade-in bg-[#0a0a0a]"}`}>
      
      {/* LEFT COLUMN: Queue listing (Always visible) */}
      <div className={`flex flex-col gap-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 ${id ? "w-full lg:w-[42%] shrink-0 lg:max-h-full pr-1 bg-[#0a0a0a]" : "w-full animate-fade-in"}`}>
        
        {/* Header (Only show if not split-pane, or keep mini-version if split-pane) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Tickets</h1>
            {!id && <p className="text-sm text-neutral-400">Manage and track support requests.</p>}
          </div>
          {user?.role === 3 && !id && (
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

        {/* Search, filters, tabs, pills */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input 
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors w-full shadow-inner"
              />
            </div>
            
            <div className="relative" ref={filterRef}>
              <button 
                onClick={openFilterModal}
                className={`px-3 py-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium transition-colors ${
                  priorityFilter !== 'All' || assigneeFilter !== 'All' 
                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                    : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                }`}
              >
                <Filter className="w-3.5 h-3.5" /> Filters
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
                      {['All', ...priorityPills].map(p => (
                        <label key={p} className="flex items-center gap-3 text-sm text-neutral-300 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="priority"
                            checked={modalPriorityFilter === p}
                            onChange={() => setModalPriorityFilter(p)}
                            className="w-4 h-4 accent-white bg-white/10 border-white/20"
                          />
                          <span className="group-hover:text-white transition-colors">{p}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Assignee</span>
                    <div className="flex flex-col gap-2">
                      {['All', 'Unassigned', 'Demo Agent'].map(a => (
                        <label key={a} className="flex items-center gap-3 text-sm text-neutral-300 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="assignee"
                            checked={modalAssigneeFilter === a}
                            onChange={() => setModalAssigneeFilter(a)}
                            className="w-4 h-4 accent-white bg-white/10 border-white/20"
                          />
                          <span className="group-hover:text-white transition-colors">{a}</span>
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
                className={`px-3 py-2 border-b-2 font-medium text-xs transition-all ${
                  queueTab === 'all' 
                    ? 'border-white text-white' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                All ({scopedTickets.length})
              </button>
              <button 
                onClick={() => setQueueTab('mine')}
                className={`px-3 py-2 border-b-2 font-medium text-xs transition-all ${
                  queueTab === 'mine' 
                    ? 'border-white text-white' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Mine ({scopedTickets.filter(t => t.assigned_to === user?.name).length})
              </button>
              <button 
                onClick={() => setQueueTab('unassigned')}
                className={`px-3 py-2 border-b-2 font-medium text-xs transition-all ${
                  queueTab === 'unassigned' 
                    ? 'border-white text-white' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Unassigned ({scopedTickets.filter(t => !t.assigned_to).length})
              </button>
            </div>
          )}

          {/* Pill filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-white/5 scrollbar-hide">
            {statusPills.map(s => (
              <button 
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors border ${
                  statusFilter === s 
                    ? 'bg-white text-black border-white' 
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-neutral-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table View (Responsively collapses columns when active selection is open) */}
        <GlassCard level={1} className="overflow-hidden mt-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[8px] font-semibold tracking-widest text-neutral-500 uppercase select-none">
                  <th onClick={() => handleSort('title')} className="p-3 font-semibold cursor-pointer hover:text-white transition-colors">Ticket{renderSortIndicator('title')}</th>
                  <th onClick={() => handleSort('status')} className="p-3 font-semibold cursor-pointer hover:text-white transition-colors">Status{renderSortIndicator('status')}</th>
                  <th onClick={() => handleSort('priority')} className="p-3 font-semibold cursor-pointer hover:text-white transition-colors">Priority{renderSortIndicator('priority')}</th>
                  {!id && <th className="p-3 font-semibold">Created By</th>}
                  {!id && <th onClick={() => handleSort('assigned_to')} className="p-3 font-semibold cursor-pointer hover:text-white transition-colors">Assigned{renderSortIndicator('assigned_to')}</th>}
                  {!id && <th onClick={() => handleSort('created_at')} className="p-3 font-semibold cursor-pointer hover:text-white transition-colors">Created{renderSortIndicator('created_at')}</th>}
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3, 4].map(n => <RowSkeleton key={n} />)
                ) : sortedTickets.length === 0 ? (
                  <tr>
                    <td colSpan={id ? "4" : "7"} className="p-12 text-center text-xs text-neutral-500">
                      <div className="flex flex-col items-center gap-3">
                        <ClipboardList className="w-10 h-10 stroke-[1.2] text-neutral-600" />
                        <div>
                          <p className="font-semibold text-white">No tickets found</p>
                          <p className="text-[10px] mt-0.5">Adjust filters or search queries.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedTickets.map((row) => (
                    <tr 
                      key={row.ticket_id} 
                      onClick={() => navigate(`/tickets/${row.ticket_id}`)}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group ${row.ticket_id === id ? "bg-white/5 border-l-2 border-l-white" : ""}`}
                    >
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-neutral-500 mb-0.5">#{String(row.ticket_id).slice(-4)}</span>
                          <span className="text-xs font-medium text-white group-hover:text-blue-300 transition-colors line-clamp-1">{row.title}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={row.status?.toLowerCase() === 'open' ? 'open' : (row.status?.toLowerCase() === 'closed' || row.status?.toLowerCase() === 'resolved' ? 'resolved' : 'inProgress')} className="capitalize text-[8px] px-1.5 py-0.5 shadow-sm">
                          {row.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase bg-white/5 text-neutral-300 border border-white/10">
                          {row.priority}
                        </span>
                      </td>
                      {!id && (
                        <td className="p-3 text-xs text-neutral-300">
                          {row.created_user?.name || 'User'}
                        </td>
                      )}
                      {!id && (
                        <td className="p-3 text-xs text-neutral-400">
                          {row.assigned_to || <span className="text-neutral-600">—</span>}
                        </td>
                      )}
                      {!id && (
                        <td className="p-3 text-xs text-neutral-500 whitespace-nowrap">
                          {new Date(row.created_at || Date.now()).toLocaleDateString()}
                        </td>
                      )}
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {user?.role === 2 && !row.assigned_to ? (
                          <button 
                            onClick={() => handleSelfAssignRow(row.ticket_id)}
                            className="px-2.5 py-1 bg-white hover:bg-neutral-200 text-black text-[10px] font-semibold rounded transition-all"
                          >
                            Claim
                          </button>
                        ) : (
                          <span 
                            onClick={() => navigate(`/tickets/${row.ticket_id}`)} 
                            className="text-[10px] text-neutral-500 group-hover:text-white transition-colors cursor-pointer"
                          >
                            View →
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

      {/* RIGHT COLUMN: Pop-up Details & Chat (Loaded when id is present) */}
      {id && (
        <div className="flex-1 flex flex-col md:flex-row gap-6 h-full overflow-hidden shrink-0 lg:max-h-full bg-[#0a0a0a] animate-fade-in relative z-10">
          {chatTicketLoading ? (
            <div className="flex-1 flex items-center justify-center text-neutral-400 bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Loading conversations...</span>
              </div>
            </div>
          ) : ticketError || !ticket ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 gap-4 bg-white/5 border border-white/10 rounded-2xl p-6">
              <MessageSquare className="w-12 h-12 text-neutral-600 stroke-[1.2]" />
              <p className="text-xs font-semibold">{ticketError || "Failed to load details."}</p>
              <button
                onClick={() => navigate('/tickets')}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold"
              >
                Close Conversation
              </button>
            </div>
          ) : (
            <>
              {/* DETAILS PANEL IN POP-UP (Left-side of right column, split ~55%) */}
              <div className="flex-[1.2] flex flex-col bg-white/5 border border-white/10 rounded-2xl p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 gap-5">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigate("/tickets")}
                    className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Queue
                  </button>
                  <button
                    onClick={() => navigate("/tickets")}
                    className="text-neutral-500 hover:text-white transition-colors text-sm font-semibold"
                    title="Close Pane"
                  >
                    ✕
                  </button>
                </div>

                {isEditing ? (
                  /* INLINE EDIT MODE */
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase">Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-white/20"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase">Description</label>
                      <textarea
                        rows={4}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-white/20 resize-none"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase">Priority</label>
                      <div className="flex gap-2">
                        {["Low", "Medium", "High"].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setEditPriority(p)}
                            className={`flex-1 py-1.5 rounded-lg border text-[10px] font-semibold transition-all ${
                              editPriority === p
                                ? "bg-white text-black border-white"
                                : "bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-2 pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditTitle(ticket.title);
                          setEditDescription(ticket.description);
                          setEditPriority(ticket.priority);
                        }}
                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveChanges}
                        className="flex-1 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-semibold transition-all"
                        disabled={updating}
                      >
                        {updating ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* DISPLAY MODE */
                  <>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-neutral-500">#{String(ticket.ticket_id).slice(-4)}</span>
                        <Badge variant={ticket.priority?.toLowerCase() || "medium"} className="capitalize text-[9px]">
                          {ticket.priority}
                        </Badge>
                        <Badge variant={ticket.status?.toLowerCase() === "open" ? "open" : ticket.status?.toLowerCase() === "closed" || ticket.status?.toLowerCase() === "resolved" ? "resolved" : "inProgress"} className="capitalize text-[9px]">
                          {ticket.status}
                        </Badge>
                      </div>
                      <h1 className="text-base font-semibold text-white tracking-tight leading-tight">
                        {ticket.title}
                      </h1>
                    </div>

                    <div className="text-neutral-300 text-xs leading-relaxed whitespace-pre-wrap py-2 border-t border-b border-white/5 max-h-[150px] overflow-y-auto scrollbar-thin">
                      {ticket.description}
                    </div>

                    {/* Metadata card rows */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[8px] font-bold tracking-wider text-neutral-500 uppercase block mb-1">Assignee</span>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-neutral-400" />
                          <span className="text-xs text-white font-medium">{ticket.assigned_to || "Unassigned"}</span>
                        </div>
                        
                        {isAgent && !ticket.assigned_to && (
                          <button
                            type="button"
                            onClick={handleSelfAssign}
                            disabled={updating}
                            className="text-[9px] text-blue-400 hover:text-blue-300 font-semibold transition-colors mt-1 block"
                          >
                            Assign to me
                          </button>
                        )}

                        {isAdmin && !ticket.assigned_to && agents.length > 0 && (
                          <div className="mt-1.5">
                            <select
                              onChange={(e) => handleAdminAssign(e.target.value)}
                              disabled={updating}
                              className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none"
                              defaultValue=""
                            >
                              <option value="" disabled className="bg-neutral-900">Assign...</option>
                              {agents.map((a) => (
                                <option key={a.user_id} value={a.user_id} className="bg-neutral-900">{a.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-[8px] font-bold tracking-wider text-neutral-500 uppercase block mb-1">Requester</span>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-neutral-400" />
                          <span className="text-xs text-white font-medium">{creatorName}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[8px] font-bold tracking-wider text-neutral-500 uppercase block mb-1">Created</span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          <span className="text-xs text-white font-medium">
                            {new Date(ticket.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions and transitions */}
                    <div className="border-t border-white/10 pt-3 flex flex-col gap-3">
                      {canManageStatus && validTransitions.length > 0 && (
                        <div>
                          <span className="text-[8px] font-bold tracking-wider text-neutral-500 uppercase block mb-1.5">Update Status</span>
                          <div className="flex gap-1.5 flex-wrap">
                            {validTransitions.map((state) => {
                              let label = `Set ${state}`;
                              let icon = <Play className="w-3 h-3" />;

                              if (state === "In Progress") {
                                label = "Start Work";
                                icon = <Play className="w-3 h-3" />;
                              } else if (state === "Resolved") {
                                label = "Resolve";
                                icon = <CheckCircle2 className="w-3 h-3 text-green-400" />;
                              } else if (state === "Closed") {
                                label = "Close";
                                icon = <X className="w-3 h-3 text-neutral-400" />;
                              } else if (state === "Reopened") {
                                label = "Reopen";
                                icon = <RotateCcw className="w-3 h-3 text-blue-400" />;
                              }

                              return (
                                <Button
                                  key={state}
                                  variant="secondary"
                                  onClick={() => handleStatusTransition(state)}
                                  disabled={updating}
                                  className="text-[10px] font-semibold py-1.5 px-2.5 flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10"
                                >
                                  {icon} {label}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {(canEditTicket || canDeleteTicket) && (
                        <div>
                          <span className="text-[8px] font-bold tracking-wider text-neutral-500 uppercase block mb-1.5">Management</span>
                          <div className="flex gap-1.5 flex-wrap">
                            {canEditTicket && (
                              <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-semibold text-neutral-400 hover:text-white transition-all flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" /> Edit
                              </button>
                            )}
                            {canDeleteTicket && (
                              <button
                                type="button"
                                onClick={handleDelete}
                                className="py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[10px] font-semibold text-red-400 hover:text-red-300 transition-all flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* DISCUSSION CHAT PANEL (Right-side of right column, split ~45%) */}
              <div className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
                  <div>
                    <h3 className="text-xs font-semibold text-white">Conversation</h3>
                    <span className="text-[9px] text-neutral-400 font-medium uppercase tracking-wider">
                      {comments.length} message{comments.length !== 1 && 's'}
                    </span>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3.5 scrollbar-thin scrollbar-thumb-white/10">
                  {comments.length === 0 ? (
                    <div className="flex flex-col h-full items-center justify-center text-center text-neutral-500 gap-1.5 p-4">
                      <MessageSquare className="w-8 h-8 stroke-[1.2] text-neutral-600" />
                      <p className="font-semibold text-xs text-neutral-400">No messages yet</p>
                      <p className="text-[9px] leading-relaxed">Discuss and resolve this ticket in the composer below.</p>
                    </div>
                  ) : (
                    sortedComments.map((c) => {
                      const isOwnComment = c.user_id === user?.user_id;
                      const commenterName = isOwnComment ? user?.name : (c.user?.name || "User");
                      const commenterInitials = commenterName.substring(0, 2).toUpperCase();
                      const commenterRole = isOwnComment ? getRoleName(user?.role) : getRoleName(c.user?.role || 3);

                      return (
                        <div
                          key={c.comment_id}
                          className={`flex gap-2 max-w-[92%] ${isOwnComment ? "self-end flex-row-reverse ml-auto" : "self-start mr-auto"}`}
                        >
                          {!isOwnComment && (
                            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[8px] font-bold text-neutral-300 uppercase">
                              {commenterInitials}
                            </div>
                          )}

                          <div className="flex flex-col">
                            <div className={`flex items-center gap-1.5 mb-0.5 text-[8px] text-neutral-500 ${isOwnComment ? "justify-end" : ""}`}>
                              <span className="font-semibold text-neutral-300">{commenterName}</span>
                              <span className="px-1 py-px text-[6px] bg-white/5 border border-white/10 rounded uppercase font-bold text-neutral-400">
                                {commenterRole}
                              </span>
                              <span>&middot;</span>
                              <span>
                                {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className={`p-2.5 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap border ${
                              isOwnComment
                                ? "bg-[#252525] border-neutral-700 text-white rounded-tr-none"
                                : "bg-[#181818] border-white/10 text-neutral-200 rounded-tl-none"
                            }`}>
                              <p>{c.comment}</p>
                            </div>
                            
                            {c.isOptimistic ? (
                              <span className="text-[7px] text-neutral-600 italic self-end mt-0.5">Sending...</span>
                            ) : (
                              isOwnComment && (
                                <div className="flex items-center justify-end gap-0.5 mt-0.5">
                                  <CheckCheck className="w-2.5 h-2.5 text-neutral-500" />
                                  <span className="text-[7px] text-neutral-600 uppercase tracking-wider font-semibold">Sent</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={commentsEndRef} />
                </div>

                {/* Chat Composer */}
                <div className="p-3 border-t border-white/10 bg-white/5 shrink-0">
                  {canComment ? (
                    <form onSubmit={handlePostComment} className="flex gap-2 items-center">
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2 focus-within:border-white/30 focus-within:bg-white/10 transition-all">
                        <button
                          type="button"
                          onClick={() => showToast("Attachments not supported yet.", "info")}
                          className="text-neutral-400 hover:text-white transition-colors shrink-0"
                          title="Add Attachment"
                        >
                          <Paperclip className="w-3 h-3" />
                        </button>
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Type message..."
                          className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none placeholder-neutral-500"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handlePostComment(e);
                            }
                          }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!commentText.trim() || updating}
                        className="w-8 h-8 rounded-full bg-white text-black hover:bg-neutral-200 transition-all flex items-center justify-center shrink-0 disabled:opacity-30 disabled:pointer-events-none hover:scale-105 active:scale-95 shadow-lg"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </form>
                  ) : (
                    <div className="bg-white/5 border border-white/5 p-2 rounded-xl flex items-center gap-2 text-neutral-500">
                      <Lock className="w-3 h-3 shrink-0" />
                      <span className="text-[9px]">
                        {isAgent
                          ? "Self-assign to chat."
                          : "Comments locked."}
                      </span>
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}

export default Tickets;
