import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ConversationHeader from '../components/tickets/ConversationHeader';
import MessageList from '../components/tickets/MessageList';
import MessageComposer from '../components/tickets/MessageComposer';
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
  Lock,
  CheckCircle2,
  Play,
  RotateCcw,
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
  fetchAgents,
} from '../services/ticketService';
import { AuthContext } from '../contexts/AuthContext';
import { ToastContext } from '../contexts/ToastContext';

function Tickets() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  // ─── Queue State ───────────────────────────────────────────────────────────
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [queueTab, setQueueTab] = useState('all');

  const [sortField, setSortField] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  const [modalPriorityFilter, setModalPriorityFilter] = useState('All');
  const [modalAssigneeFilter, setModalAssigneeFilter] = useState('All');

  const filterRef = useRef(null);

  // ─── Selected Ticket & Chat State ─────────────────────────────────────────
  const [ticket, setTicket] = useState(null);
  const [chatTicketLoading, setChatTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [assigningTicketId, setAssigningTicketId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [agents, setAgents] = useState([]);

  // ─── Mobile: Detail Drawer State ──────────────────────────────────────────
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  // ─── Data Loaders ──────────────────────────────────────────────────────────
  const loadTickets = async () => {
    try {
      const data = await fetchTickets();
      if (data.status === 200 && data.tickets) {
        setTickets(data.tickets);
      } else {
        setError(data.message || 'Failed to retrieve ticket list.');
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setError('Failed to fetch tickets. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  const loadSelectedTicket = async () => {
    if (!id) { setTicket(null); setComments([]); return; }
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
        setTicketError('You do not have permission to view this ticket.');
      } else if (data.status === 404) {
        setTicketError('Ticket not found.');
      } else {
        setTicketError(data.message || 'Failed to load ticket details.');
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        setTicketError('You do not have permission to view this ticket.');
      } else {
        setTicketError(err.response?.data?.message || 'Failed to load ticket details.');
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
      console.error('Failed to load comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    loadSelectedTicket();
    loadSelectedComments();
    setDetailDrawerOpen(false); // close drawer when ticket changes
  }, [id]);

  useEffect(() => {
    if (user?.role === 1) {
      const loadAgentsList = async () => {
        try {
          const result = await fetchAgents();
          if (result.status === 200 && result.agents) setAgents(result.agents);
        } catch (err) {
          console.error('Failed to fetch agents:', err);
        }
      };
      loadAgentsList();
    }
  }, [user]);

  // Close filter on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Filter / Sort Helpers ─────────────────────────────────────────────────
  const handleApplyFilters = () => {
    setPriorityFilter(modalPriorityFilter);
    setAssigneeFilter(modalAssigneeFilter);
    setFilterOpen(false);
  };
  const handleClearFilters = () => {
    setModalPriorityFilter('All'); setModalAssigneeFilter('All');
    setPriorityFilter('All'); setAssigneeFilter('All');
    setFilterOpen(false);
  };
  const openFilterModal = () => {
    setModalPriorityFilter(priorityFilter);
    setModalAssigneeFilter(assigneeFilter);
    setFilterOpen(true);
  };

  const handleSort = (field) => {
    if (sortField === field) { setSortAsc(!sortAsc); }
    else { setSortField(field); setSortAsc(field === 'title' || field === 'status' || field === 'assigned_to'); }
  };

  // ─── Ticket Action Handlers ────────────────────────────────────────────────
  const updateTicketState = (ticketId, updates) => {
    const isUpdatedTicket = (currentTicket) => String(currentTicket.ticket_id) === String(ticketId);

    setTickets((currentTickets) => currentTickets.map((currentTicket) => (
      isUpdatedTicket(currentTicket) ? { ...currentTicket, ...updates } : currentTicket
    )));
    setTicket((currentTicket) => (
      currentTicket && isUpdatedTicket(currentTicket) ? { ...currentTicket, ...updates } : currentTicket
    ));
  };

  const handleSelfAssignRow = async (ticketId) => {
    setAssigningTicketId(ticketId);
    try {
      const data = await assignTicket(ticketId, user.user_id);
      if (data.status === 200 && data.ticket) {
        updateTicketState(ticketId, data.ticket);
        showToast('Ticket assigned to you.', 'success');
      } else showToast(data.message || 'Failed to assign ticket.', 'error');
    } catch (err) { console.error(err); showToast('Error during assignment.', 'error'); }
    finally { setAssigningTicketId(null); }
  };

  const handleStatusTransition = async (nextStatus) => {
    setUpdating(true);
    try {
      const data = await updateTicketStatus(id, nextStatus, ticket.status, user?.role);
      if (data.status === 200) {
        updateTicketState(id, { status: data.data?.status || nextStatus });
        showToast(`Status updated to ${nextStatus}.`, 'success');
        loadTickets();
      } else showToast(data.message || 'Status transition denied.', 'error');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Error executing status transition.', 'error');
    } finally { setUpdating(false); }
  };

  const handleSelfAssign = async () => {
    setUpdating(true);
    try {
      const data = await assignTicket(id, user.user_id);
      if (data.status === 200 && data.ticket) { updateTicketState(id, data.ticket); showToast('Ticket assigned to you.', 'success'); }
      else showToast(data.message || 'Failed to assign ticket.', 'error');
    } catch (err) { console.error(err); showToast('Error assigning ticket.', 'error'); }
    finally { setUpdating(false); }
  };

  const handleAdminAssign = async (agentId) => {
    setUpdating(true);
    try {
      const data = await assignTicket(id, agentId);
      if (data.status === 200 && data.ticket) { updateTicketState(id, data.ticket); showToast('Ticket assigned successfully.', 'success'); }
      else showToast(data.message || 'Failed to assign ticket.', 'error');
    } catch (err) { console.error(err); showToast('Error assigning ticket.', 'error'); }
    finally { setUpdating(false); }
  };

  const handleSaveChanges = async () => {
    if (!editTitle.trim() || !editDescription.trim()) { showToast('Title and Description are required.', 'error'); return; }
    setUpdating(true);
    try {
      const result = await updateTicket(id, { title: editTitle.trim(), description: editDescription.trim(), priority: editPriority });
      if (result.status === 200 && result.ticket) {
        setTicket(result.ticket); setIsEditing(false);
        showToast('Ticket details saved.', 'success'); loadTickets();
      } else showToast(result.message || 'Failed to save changes.', 'error');
    } catch (err) { console.error(err); showToast('Error updating ticket.', 'error'); }
    finally { setUpdating(false); }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      setUpdating(true);
      try {
        const result = await deleteTicket(id);
        if (result.status === 200) {
          setTickets((currentTickets) => currentTickets.filter((currentTicket) => String(currentTicket.ticket_id) !== String(id)));
          setTicket(null);
          showToast('Ticket deleted.', 'success');
          navigate('/tickets');
          loadTickets();
        }
        else showToast(result.message || 'Failed to delete ticket.', 'error');
      } catch (err) { console.error(err); showToast('Error deleting ticket.', 'error'); }
      finally { setUpdating(false); }
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const textToSubmit = commentText.trim();
    setCommentText('');
    const tempId = Math.random().toString(36).substring(2, 9);
    const optimisticMessage = {
      comment_id: tempId,
      comment: textToSubmit,
      created_at: new Date().toISOString(),
      user_id: user.user_id,
      user: { name: user.name, role: user.role },
      isOptimistic: true,
    };
    setComments((prev) => [...prev, optimisticMessage]);
    try {
      const result = await createComment(id, textToSubmit);
      if (result.status === 201 && result.comment) {
        setComments((prev) => prev.map((c) => (c.comment_id === tempId ? result.comment : c)));
      } else {
        showToast(result.message || 'Failed to send comment.', 'error');
        setComments((prev) => prev.filter((c) => c.comment_id !== tempId));
      }
    } catch (err) {
      console.error(err); showToast('Error posting comment.', 'error');
      setComments((prev) => prev.filter((c) => c.comment_id !== tempId));
    }
  };

  // ─── RBAC ─────────────────────────────────────────────────────────────────
  const isAdmin = user?.role === 1;
  const isAgent = user?.role === 2;
  const isEndUser = user?.role === 3;
  const isAssignedToMe = ticket && (ticket.assigned_to_id
    ? ticket.assigned_to_id === user?.user_id
    : ticket.assigned_to === user?.name);
  const isCreatorOfTicket = ticket && ticket.created_by === user?.user_id;
  const canManageStatus = isAdmin || (isAgent && isAssignedToMe);
  const canEditTicket = false;
  const canDeleteTicket = isAdmin;
  const isClosedTicket = ticket?.status?.toLowerCase() === 'closed';
  const hasAssignment = Boolean(ticket?.assigned_to_id || ticket?.assigned_to);
  const agentCommentLockMessage = !hasAssignment
    ? 'Assign this ticket to yourself to reply.'
    : 'This ticket is assigned to another agent.';
  const canComment = !isClosedTicket && (isAdmin || (isAgent && isAssignedToMe) || (isEndUser && isCreatorOfTicket));

  const allowedTransitions = {
    Open: ['Assigned'],
    Assigned: ['In Progress'],
    'In Progress': ['Resolved'],
    Resolved: ['Closed', 'Reopened'],
    Closed: [],
    Reopened: ['In Progress'],
  };

  const nextTransitions = ticket ? (allowedTransitions[ticket.status] || []) : [];
  const validTransitions = nextTransitions.filter((state) => {
    if (state === 'Closed' || state === 'Reopened') return isAdmin;
    return true;
  });

  const getRoleName = (roleNum) => {
    if (roleNum === 1) return 'Admin';
    if (roleNum === 2) return 'Agent';
    return 'Customer';
  };

  // ─── Filtering / Sorting ──────────────────────────────────────────────────
  const scopedTickets = user?.role === 3
    ? tickets.filter((t) => t.created_by === user.user_id)
    : tickets;

  const tabScopedTickets = user?.role !== 3
    ? scopedTickets.filter((t) => {
        if (queueTab === 'mine') return t.assigned_to === user?.name;
        if (queueTab === 'unassigned') return !t.assigned_to;
        return true;
      })
    : scopedTickets;

  const filteredTickets = tabScopedTickets.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      String(t.ticket_id).toLowerCase().includes(search.toLowerCase());
    let matchesStatus = false;
    if (statusFilter === 'All Status') matchesStatus = true;
    else if (statusFilter.toLowerCase() === 'resolved') {
      matchesStatus = t.status?.toLowerCase() === 'resolved' || t.status?.toLowerCase() === 'closed';
    } else {
      matchesStatus = t.status?.toLowerCase() === statusFilter.toLowerCase();
    }
    const matchesPriority = priorityFilter === 'All' || t.priority?.toLowerCase() === priorityFilter.toLowerCase();
    let matchesAssignee = false;
    if (assigneeFilter === 'All') matchesAssignee = true;
    else if (assigneeFilter === 'Unassigned') matchesAssignee = !t.assigned_to;
    else matchesAssignee = t.assigned_to === assigneeFilter;
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
  const creatorName = ticket?.created_by === user?.user_id
    ? user?.name
    : (ticket?.created_user?.name || 'Customer');

  // ─── Skeletons ────────────────────────────────────────────────────────────
  const CardSkeleton = () => (
    <div className="animate-pulse flex items-center gap-3 py-3 px-3 border-b border-white/5">
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-2 w-12 bg-white/10 rounded" />
        <div className="h-4 w-3/4 bg-white/10 rounded" />
      </div>
      <div className="h-5 w-16 bg-white/10 rounded" />
    </div>
  );

  // ─── Ticket Detail Shared Content ─────────────────────────────────────────
  const TicketDetailContent = () => {
    if (!ticket) return null;
    return (
      <div className="flex flex-col gap-4">
        {isEditing ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase">Title</label>
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-white/20" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase">Description</label>
              <textarea rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-white/20 resize-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase">Priority</label>
              <div className="flex gap-2">
                {['Low', 'Medium', 'High'].map((p) => (
                  <button key={p} type="button" onClick={() => setEditPriority(p)}
                    className={`flex-1 py-1.5 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${editPriority === p ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-white/10">
              <button type="button" onClick={() => { setIsEditing(false); setEditTitle(ticket.title); setEditDescription(ticket.description); setEditPriority(ticket.priority); }}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white transition-all cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={handleSaveChanges} disabled={updating}
                className="flex-1 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50">
                {updating ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* IDs & Badges */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="text-[10px] font-mono text-neutral-500">#{String(ticket.ticket_id).slice(-4)}</span>
                <Badge variant={ticket.priority?.toLowerCase() || 'medium'} className="capitalize text-[9px]">{ticket.priority}</Badge>
                <Badge variant={ticket.status?.toLowerCase() === 'open' ? 'open' : (ticket.status?.toLowerCase() === 'closed' || ticket.status?.toLowerCase() === 'resolved' ? 'resolved' : 'inProgress')} className="capitalize text-[9px]">{ticket.status}</Badge>
              </div>
              <h2 className="text-sm font-semibold text-white leading-tight">{ticket.title}</h2>
            </div>

            {/* Description */}
            <div className="text-neutral-400 text-xs leading-relaxed whitespace-pre-wrap py-2 border-t border-b border-white/5 max-h-[100px] overflow-y-auto scrollbar-thin">
              {ticket.description}
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Assignee */}
              <div>
                <span className="text-[8px] font-bold tracking-wider text-neutral-500 uppercase block mb-1">Assignee</span>
                
                {(!isAdmin || agents.length === 0) ? (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-neutral-400" />
                    <span className="text-white font-medium text-xs">{ticket.assigned_to || 'Unassigned'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-neutral-400 shrink-0" />
                    <select
                      onChange={(e) => handleAdminAssign(e.target.value)}
                      disabled={updating}
                      className="flex-1 bg-transparent border-b border-white/10 hover:border-white/30 focus:border-blue-500 py-0.5 text-xs text-white font-medium focus:outline-none cursor-pointer transition-colors"
                      value={ticket.assigned_to_id || ""}
                    >
                      <option value="" disabled className="bg-neutral-900">
                        {ticket.assigned_to ? 'Change Assignee…' : 'Assign…'}
                      </option>
                      {agents.map((a) => (
                        <option key={a.user_id} value={a.user_id} className="bg-neutral-900">{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {isAgent && !ticket.assigned_to && (
                  <button onClick={handleSelfAssign} disabled={updating}
                    className="text-[9px] text-blue-400 hover:text-blue-300 font-semibold mt-1 block cursor-pointer">
                    Assign to me
                  </button>
                )}
              </div>

              {/* Requester */}
              <div>
                <span className="text-[8px] font-bold tracking-wider text-neutral-500 uppercase block mb-1">Requester</span>
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 text-neutral-400" />
                  <span className="text-white font-medium text-xs">{creatorName}</span>
                </div>
              </div>

              {/* Created */}
              <div>
                <span className="text-[8px] font-bold tracking-wider text-neutral-500 uppercase block mb-1">Created</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span className="text-white font-medium text-xs">
                    {new Date(ticket.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              {/* Updated */}
              <div>
                <span className="text-[8px] font-bold tracking-wider text-neutral-500 uppercase block mb-1">Updated</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span className="text-white font-medium text-xs">
                    {new Date(ticket.updated_at || ticket.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  // On mobile: if a ticket is open → show conversation full screen; else show queue.
  // On desktop (lg+): two-column layout always.

  const showConversation = !!id;
  const showQueueOnMobile = !id;

  return (
    <div className="w-full text-white h-[calc(100vh-140px)] min-h-[600px] flex flex-col lg:flex-row gap-4 overflow-hidden">

      {/* ═══════════════════════════════════════════════════════
          LEFT COLUMN — Queue + Detail + Actions (stacked)
          Mobile: hidden when conversation is active
          ═══════════════════════════════════════════════════════ */}
      <div className={`flex flex-col gap-4 lg:w-[42%] lg:flex-shrink-0 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 ${showConversation ? 'hidden lg:flex' : 'flex'}`}>

        {/* ── CARD 1: Ticket Queue ── */}
        <div className="flex flex-col gap-3">
          {/* Queue header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-white">Tickets</h1>
              <p className="text-xs text-neutral-400 mt-0.5">Manage support requests</p>
            </div>
            {user?.role === 3 && (
              <Button variant="primary" className="flex items-center gap-2 text-xs" onClick={() => navigate('/create')}>
                <Plus className="w-3.5 h-3.5" /> New
              </Button>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-3 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Search + Filter row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input type="text" placeholder="Search tickets…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors w-full" />
            </div>
            <div className="relative" ref={filterRef}>
              <button onClick={openFilterModal}
                className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${priorityFilter !== 'All' || assigneeFilter !== 'All' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'}`}>
                <Filter className="w-3.5 h-3.5" /> Filters
              </button>
              {filterOpen && (
                <GlassCard level={3} className="absolute right-0 top-12 w-64 p-4 flex flex-col gap-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Filters</h3>
                    <button onClick={() => setFilterOpen(false)} className="text-neutral-500 hover:text-white cursor-pointer">✕</button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-bold tracking-widest text-neutral-500 uppercase">Priority</span>
                    {['All', ...priorityPills].map((p) => (
                      <label key={p} className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer">
                        <input type="radio" name="priority" checked={modalPriorityFilter === p}
                          onChange={() => setModalPriorityFilter(p)} className="w-3.5 h-3.5 accent-white" />
                        {p}
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <button onClick={handleClearFilters} className="text-xs text-neutral-400 hover:text-white cursor-pointer">Clear</button>
                    <button onClick={handleApplyFilters} className="text-xs font-semibold bg-white text-black px-3 py-1.5 rounded-lg hover:bg-neutral-200 cursor-pointer">Apply</button>
                  </div>
                </GlassCard>
              )}
            </div>
          </div>

          {/* Tabs (Admin/Agent only) */}
          {user?.role !== 3 && (
            <div className="flex gap-1 border-b border-white/5">
              {[
                { key: 'all', label: `All (${scopedTickets.length})` },
                { key: 'mine', label: `Mine (${scopedTickets.filter((t) => t.assigned_to === user?.name).length})` },
                { key: 'unassigned', label: `Unassigned (${scopedTickets.filter((t) => !t.assigned_to).length})` },
              ].map((tab) => (
                <button key={tab.key} onClick={() => setQueueTab(tab.key)}
                  className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${queueTab === tab.key ? 'border-white text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Status pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {statusPills.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors border cursor-pointer ${statusFilter === s ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-neutral-200'}`}>
                {s}
              </button>
            ))}
          </div>

          {/* Ticket List — Card layout on all screens (replaces overflowing table) */}
          <GlassCard level={1} className="overflow-hidden">
            {loading ? (
              <div className="flex flex-col">{[1, 2, 3, 4].map((n) => <CardSkeleton key={n} />)}</div>
            ) : sortedTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-neutral-500 gap-2">
                <ClipboardList className="w-9 h-9 stroke-[1.2] text-neutral-600" />
                <p className="text-xs font-semibold text-white">No tickets found</p>
                <p className="text-[10px]">Adjust filters or search queries.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-white/5">
                {sortedTickets.map((row) => (
                  <div key={row.ticket_id}
                    onClick={() => navigate(`/tickets/${row.ticket_id}`)}
                    className={`flex items-center gap-3 px-3 py-3 hover:bg-white/5 cursor-pointer transition-colors group ${row.ticket_id === id ? 'bg-white/7 border-l-2 border-l-blue-500' : ''}`}
                    style={row.ticket_id === id ? { background: 'rgba(255,255,255,0.05)' } : {}}
                  >
                    {/* Initials Avatar */}
                    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[9px] font-bold text-neutral-400 uppercase">
                      {(row.created_user?.name || row.title || 'U').substring(0, 2)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] text-neutral-500 font-mono">#{String(row.ticket_id).slice(-4)}</span>
                        <Badge variant={row.priority?.toLowerCase() || 'medium'} className="text-[7px] px-1 py-0 uppercase">{row.priority}</Badge>
                      </div>
                      <p className="text-xs font-medium text-white group-hover:text-blue-300 transition-colors truncate">{row.title}</p>
                      <p className="text-[9px] text-neutral-500 mt-0.5">
                        {new Date(row.created_at || Date.now()).toLocaleDateString()}
                        {row.assigned_to && <span className="ml-2 text-blue-400">Assigned: {row.assigned_to}</span>}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {user?.role === 2 && !row.assigned_to && (
                        <button onClick={(e) => { e.stopPropagation(); handleSelfAssignRow(row.ticket_id); }}
                          disabled={assigningTicketId === row.ticket_id}
                          className="text-[9px] bg-white text-black px-2 py-1 rounded font-semibold hover:bg-neutral-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          {assigningTicketId === row.ticket_id ? 'Assigning…' : 'Assign to me'}
                        </button>
                      )}
                      {!(user?.role === 2 && !row.assigned_to) && (
                        <Badge variant={row.status?.toLowerCase() === 'open' ? 'open' : (row.status?.toLowerCase() === 'closed' || row.status?.toLowerCase() === 'resolved' ? 'resolved' : 'inProgress')}
                          className="capitalize text-[8px] px-1.5 py-0.5">{row.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* ── CARDS 2 & 3: Details + Actions (only when a ticket is selected, desktop view) ── */}
        {id && ticket && !chatTicketLoading && (
          <>
            {/* CARD 2: Ticket Details */}
            <GlassCard level={1} className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[9px] font-bold tracking-widest text-neutral-500 uppercase">Ticket Details</h3>
                <button onClick={() => navigate('/tickets')} className="text-neutral-500 hover:text-white text-xs cursor-pointer">✕</button>
              </div>
              <TicketDetailContent />
            </GlassCard>

            {/* CARD 3: Ticket Actions */}
            {(canManageStatus || canEditTicket || canDeleteTicket) && !isEditing && (
              <GlassCard level={1} className="p-5 flex flex-col gap-3">
                <h3 className="text-[9px] font-bold tracking-widest text-neutral-500 uppercase">Ticket Actions</h3>

                {canManageStatus && validTransitions.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] text-neutral-500 uppercase font-semibold tracking-wider">Update Status</span>
                    <div className="flex gap-2 flex-wrap">
                      {validTransitions.map((state) => {
                        let label = `Set ${state}`;
                        let icon = <Play className="w-3 h-3" />;
                        if (state === 'In Progress') { label = 'Start Work'; icon = <Play className="w-3 h-3" />; }
                        else if (state === 'Resolved') { label = 'Resolve'; icon = <CheckCircle2 className="w-3 h-3 text-emerald-400" />; }
                        else if (state === 'Closed') { label = 'Close'; icon = <X className="w-3 h-3" />; }
                        else if (state === 'Reopened') { label = 'Reopen'; icon = <RotateCcw className="w-3 h-3 text-blue-400" />; }
                        return (
                          <button key={state} onClick={() => handleStatusTransition(state)} disabled={updating}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer disabled:opacity-50">
                            {icon} {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap pt-2 border-t border-white/5">
                  {canEditTicket && (
                    <button onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
                      <Edit className="w-3 h-3" /> Edit
                    </button>
                  )}
                  {canDeleteTicket && (
                    <button onClick={handleDelete}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-semibold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  )}
                  <button onClick={() => navigate('/tickets')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-semibold text-neutral-400 hover:text-white transition-all cursor-pointer">
                    <ArrowLeft className="w-3 h-3" /> Back to Queue
                  </button>
                </div>
              </GlassCard>
            )}
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          RIGHT COLUMN — Full-height Conversation Panel
          Mobile: shown only when a ticket is selected (full screen)
          ═══════════════════════════════════════════════════════ */}
      {id && (
        <div className={`flex-1 flex flex-col overflow-hidden rounded-2xl border border-white/10 ${showConversation ? 'flex' : 'hidden lg:flex'}`}
          style={{ background: 'rgba(255,255,255,0.03)', minHeight: 0 }}>

          {chatTicketLoading ? (
            <div className="flex-1 flex items-center justify-center text-neutral-400">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                <span className="text-sm">Loading conversation…</span>
              </div>
            </div>
          ) : ticketError || !ticket ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 gap-4 p-6">
              <MessageSquare className="w-12 h-12 text-neutral-600 stroke-[1.2]" />
              <p className="text-xs font-semibold">{ticketError || 'Failed to load details.'}</p>
              <button onClick={() => navigate('/tickets')}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold cursor-pointer">
                Back to Queue
              </button>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <ConversationHeader
                customerName={creatorName}
                ticketId={ticket.ticket_id}
                createdAt={ticket.created_at}
                onBack={() => navigate('/tickets')}
                onShowDetails={() => setDetailDrawerOpen(true)}
              />

              {/* Message List */}
              <MessageList
                comments={[...comments].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))}
                currentUserId={user?.user_id}
                getRoleName={getRoleName}
                loading={commentsLoading}
              />

              {/* Composer */}
              <MessageComposer
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onSubmit={handlePostComment}
                canComment={canComment}
                isAgent={isAgent}
                isClosed={isClosedTicket}
                lockMessage={isAgent ? agentCommentLockMessage : undefined}
                onAttachment={() => showToast('Attachments not supported yet.', 'info')}
              />
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MOBILE DETAIL DRAWER OVERLAY
          Slides up when user taps the conversation header info button
          ═══════════════════════════════════════════════════════ */}
      {detailDrawerOpen && ticket && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden"
          onClick={(e) => { if (e.target === e.currentTarget) setDetailDrawerOpen(false); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Drawer Sheet */}
          <div className="relative w-full bg-[#111] border-t border-white/10 rounded-t-3xl p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto z-10 animate-in slide-in-from-bottom-4 duration-300">
            {/* Drag handle */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/20 rounded-full" />

            <div className="flex items-center justify-between pt-2">
              <h3 className="text-sm font-semibold text-white">Ticket Details</h3>
              <button onClick={() => setDetailDrawerOpen(false)} className="text-neutral-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <TicketDetailContent />

            {/* Actions inside drawer on mobile */}
            {(canManageStatus || canEditTicket || canDeleteTicket) && !isEditing && (
              <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                <span className="text-[9px] font-bold tracking-widest text-neutral-500 uppercase">Ticket Actions</span>
                {canManageStatus && validTransitions.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {validTransitions.map((state) => {
                      let label = `Set ${state}`;
                      let icon = <Play className="w-3 h-3" />;
                      if (state === 'In Progress') { label = 'Start Work'; }
                      else if (state === 'Resolved') { label = 'Resolve'; icon = <CheckCircle2 className="w-3 h-3 text-emerald-400" />; }
                      else if (state === 'Closed') { label = 'Close'; icon = <X className="w-3 h-3" />; }
                      else if (state === 'Reopened') { label = 'Reopen'; icon = <RotateCcw className="w-3 h-3 text-blue-400" />; }
                      return (
                        <button key={state} onClick={() => { handleStatusTransition(state); setDetailDrawerOpen(false); }} disabled={updating}
                          className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-white/10 cursor-pointer">
                          {icon} {label}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  {canEditTicket && (
                    <button onClick={() => { setIsEditing(true); setDetailDrawerOpen(false); }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-white/10 cursor-pointer">
                      <Edit className="w-3 h-3" /> Edit
                    </button>
                  )}
                  {canDeleteTicket && (
                    <button onClick={() => { handleDelete(); setDetailDrawerOpen(false); }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-semibold text-red-400 cursor-pointer">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          FULL-WIDTH QUEUE ONLY (no ticket selected)
          ═══════════════════════════════════════════════════════ */}
      {!id && (
        <div className="hidden" /> // left column handles full width automatically via flex
      )}
    </div>
  );
}

export default Tickets;
