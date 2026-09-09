import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { ToastContext } from "../contexts/ToastContext";
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
} from "../services/ticketService";
import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import {
  ArrowLeft,
  Clock,
  User,
  MessageSquare,
  Edit,
  Trash2,
  X,
  Send,
  Lock,
  CheckCircle2,
  Play,
  RotateCcw,
  Phone,
  MoreVertical,
  Paperclip,
  Check,
  CheckCheck,
  Search,
} from "lucide-react";

function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ticketError, setTicketError] = useState(null);
  const [updating, setUpdating] = useState(false);



  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("Medium");

  // Comments State
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(true);

  // Agents list (Admin only)
  const [agents, setAgents] = useState([]);

  const commentsEndRef = useRef(null);

  const loadTicket = async () => {
    try {
      setTicketError(null);

      const data = await fetchTicketById(id);

      if (data.status === 200 && data.ticket) {
        setTicket(data.ticket);
        setEditTitle(data.ticket.title || "");
        setEditDescription(data.ticket.description || "");
        setEditPriority(data.ticket.priority || "Medium");
      } else if (data.status === 403) {
        setTicket(null);
        setTicketError("You do not have permission to view this ticket.");
      } else if (data.status === 404) {
        setTicket(null);
        setTicketError("Ticket not found.");
      } else {
        setTicket(null);
        setTicketError(data.message || "Failed to load ticket details.");
      }
    } catch (error) {
      console.error("Failed to load ticket:", error);

      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 403) {
        setTicketError("You do not have permission to view this ticket.");
      } else if (status === 404) {
        setTicketError("Ticket not found.");
      } else {
        setTicketError(message || "Failed to load ticket details.");
      }

      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
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
    loadTicket();
    loadComments();
  }, [id]);

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

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (comments.length > 0) {
      scrollToBottom();
    }
  }, [comments]);

  // RBAC checks
  const isAdmin = user?.role === 1;
  const isAgent = user?.role === 2;
  const isEndUser = user?.role === 3;

  const isAssignedToMe = ticket && (ticket.assigned_to_id
    ? ticket.assigned_to_id === user?.user_id
    : ticket.assigned_to === user?.name);
  const isCreatorOfTicket = ticket && ticket.created_by === user?.user_id;

  // Authorization flags
  const canManageStatus = isAdmin || (isAgent && isAssignedToMe);
  const canEditTicket = false;
  const canDeleteTicket = isAdmin;
  const isClosedTicket = ticket?.status?.toLowerCase() === "closed";
  const hasAssignment = Boolean(ticket?.assigned_to_id || ticket?.assigned_to);
  const agentCommentLockMessage = !hasAssignment
    ? "Assign this ticket to yourself to reply."
    : "This ticket is assigned to another agent.";
  const canComment =
    !isClosedTicket && (isAdmin || (isAgent && isAssignedToMe) || (isEndUser && isCreatorOfTicket));

  // Sort comments chronologically by actual created_at datetime ascending
  const sortedComments = [...comments].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateA - dateB;
  });

  // Allowed transitions matching backend logic
  const allowedTransitions = {
    Open: ["Assigned"],
    Assigned: ["In Progress"],
    "In Progress": ["Resolved"],
    Resolved: ["Closed", "Reopened"],
    Closed: [],
    Reopened: ["In Progress"],
  };

  const handleStatusTransition = async (nextStatus) => {
    setUpdating(true);
    try {
      const data = await updateTicketStatus(
        id,
        nextStatus,
        ticket.status,
        user?.role,
      );
      if (data.status === 200) {
        showToast(`Status updated to ${nextStatus}.`, "success");
        // Reload details to capture relational mapping
        await loadTicket();
      } else {
        showToast(data.message || "Status transition denied.", "error");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      showToast(
        error.response?.data?.message || "Error executing status transition.",
        "error",
      );
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
        await loadTicket();
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

  const handleAdminAssign = async (agentId) => {
    setUpdating(true);
    try {
      const data = await assignTicket(id, agentId);
      if (data.status === 200) {
        showToast("Ticket assigned successfully.", "success");
        await loadTicket();
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
        priority: editPriority,
      });
      if (result.status === 200 && result.ticket) {
        setTicket(result.ticket);
        setIsEditing(false);
        showToast("Ticket details saved.", "success");
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
    if (
      window.confirm(
        "Are you sure you want to delete this ticket? This action cannot be undone.",
      )
    ) {
      setUpdating(true);
      try {
        const result = await deleteTicket(id);
        if (result.status === 200) {
          showToast("Ticket deleted successfully.", "success");
          navigate("/tickets");
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

    // Optimistic UI updates
    const tempId = Math.random().toString(36).substring(2, 9);
    const optimisticMessage = {
      comment_id: tempId,
      comment: textToSubmit,
      created_at: new Date().toISOString(),
      user_id: user.user_id,
      user: {
        name: user.name,
        role: user.role,
      },
      isOptimistic: true,
    };

    setComments((prev) => [...prev, optimisticMessage]);

    try {
      const result = await createComment(id, textToSubmit);
      if (result.status === 201 && result.comment) {
        setComments((prev) =>
          prev.map((c) => (c.comment_id === tempId ? result.comment : c)),
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

    if (loading) {
    return (
      <div className="flex h-[calc(100vh-140px)] items-center justify-center text-neutral-400 bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading ticket details...</span>
        </div>
      </div>
    );
  }

  if (ticketError || !ticket) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] items-center justify-center text-neutral-400 gap-4 bg-[#0a0a0a]">
        <MessageSquare className="w-12 h-12 text-neutral-600 stroke-[1.2]" />
        <p className="text-sm font-semibold">{ticketError || "Failed to load ticket details."}</p>
        <Button variant="secondary" onClick={() => navigate("/tickets")}>
          Back to Ticket Queue
        </Button>
      </div>
    );
  }

  const getRoleName = (roleNum) => {
    if (roleNum === 1) return "Admin";
    if (roleNum === 2) return "Agent";
    return "Customer";
  };

  const creatorName = ticket.created_by === user.user_id ? user.name : (ticket.created_user?.name || "Customer");

  const nextTransitions = allowedTransitions[ticket.status] || [];
  const validTransitions = nextTransitions.filter((state) => {
    if (state === "Closed" || state === "Reopened") {
      return isAdmin;
    }
    return true;
  });

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full h-auto min-h-0 md:h-[calc(100vh-140px)] md:min-h-[600px] text-white pt-2 md:pt-4 overflow-visible md:overflow-hidden relative bg-[#0a0a0a]">
      
      {/* LEFT COLUMN: Ticket Details & Metadata (~55% width) */}
      <div className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md overflow-visible md:overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 gap-5">
        
        <button
          onClick={() => navigate("/tickets")}
          className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors self-start mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Queue
        </button>

        {isEditing ? (
          /* INLINE EDIT MODE */
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/20"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase">Description</label>
              <textarea
                rows={5}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/20 resize-none"
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
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
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
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          /* DISPLAY MODE */
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-neutral-500">#{String(ticket.ticket_id).slice(-4)}</span>
                <Badge variant={ticket.priority?.toLowerCase() || "medium"} className="capitalize">
                  {ticket.priority}
                </Badge>
                <Badge variant={ticket.status?.toLowerCase() === "open" ? "open" : ticket.status?.toLowerCase() === "closed" || ticket.status?.toLowerCase() === "resolved" ? "resolved" : "inProgress"} className="capitalize">
                  {ticket.status}
                </Badge>
              </div>
              <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight leading-tight">
                {ticket.title}
              </h1>
            </div>

            <div className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap py-2 border-t border-b border-white/5">
              {ticket.description}
            </div>

            {/* Metadata Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <span className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase block mb-1">Assignee</span>
                
                {(!isAdmin || agents.length === 0) ? (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-xs text-white font-medium">{ticket.assigned_to || "Unassigned"}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <select
                      onChange={(e) => handleAdminAssign(e.target.value)}
                      disabled={updating}
                      className="flex-1 bg-transparent border-b border-white/10 hover:border-white/30 focus:border-blue-500 py-0.5 text-xs text-white font-medium focus:outline-none cursor-pointer transition-colors"
                      value={ticket.assigned_to_id || ""}
                    >
                      <option value="" disabled className="bg-neutral-900">
                        {ticket.assigned_to ? 'Change Assignee...' : 'Assign Agent...'}
                      </option>
                      {agents.map((a) => (
                        <option key={a.user_id} value={a.user_id} className="bg-neutral-900">{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Agent self-assignment */}
                {isAgent && !ticket.assigned_to && (
                  <button
                    type="button"
                    onClick={handleSelfAssign}
                    disabled={updating}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold transition-colors mt-1.5 block"
                  >
                    Assign to me
                  </button>
                )}
              </div>

              <div>
                <span className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase block mb-1">Requester</span>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-xs text-white font-medium">{creatorName}</span>
                </div>
              </div>

              <div>
                <span className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase block mb-1">Created</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-xs text-white font-medium">
                    {new Date(ticket.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Block */}
            <div className="border-t border-white/10 pt-4 flex flex-col gap-4">
              
              {canManageStatus && validTransitions.length > 0 && (
                <div>
                  <span className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase block mb-2">Update Status</span>
                  <div className="flex gap-2 flex-wrap">
                    {validTransitions.map((state) => {
                      let label = `Set ${state}`;
                      let icon = <Play className="w-3.5 h-3.5" />;

                      if (state === "In Progress") {
                        label = "Start Work";
                        icon = <Play className="w-3.5 h-3.5" />;
                      } else if (state === "Resolved") {
                        label = "Resolve Ticket";
                        icon = <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
                      } else if (state === "Closed") {
                        label = "Close Ticket";
                        icon = <X className="w-3.5 h-3.5 text-neutral-400" />;
                      } else if (state === "Reopened") {
                        label = "Reopen Ticket";
                        icon = <RotateCcw className="w-3.5 h-3.5 text-blue-400" />;
                      }

                      return (
                        <Button
                          key={state}
                          variant="secondary"
                          onClick={() => handleStatusTransition(state)}
                          disabled={updating}
                          className="text-xs font-semibold py-2 px-3 flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10"
                        >
                          {icon} {label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Edit / Delete Section */}
              {(canEditTicket || canDeleteTicket) && (
                <div>
                  <span className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase block mb-2">Management</span>
                  <div className="flex gap-2 flex-wrap">
                    {canEditTicket && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Details
                      </button>
                    )}
                    {canDeleteTicket && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="py-2 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 transition-all flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Ticket
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>

      {/* RIGHT COLUMN: Chat Conversation (~45% width) */}
      <div className="w-full md:w-[450px] lg:w-[480px] shrink-0 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md min-h-[450px] max-h-[70vh] md:max-h-none md:h-full">
        
        {/* Chat Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-white">Conversation</h3>
            <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
              {comments.length} message{comments.length !== 1 && 's'}
            </span>
          </div>
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          {comments.length === 0 ? (
            <div className="flex flex-col h-full items-center justify-center text-center text-neutral-500 gap-2 p-6">
              <MessageSquare className="w-10 h-10 stroke-[1.2] text-neutral-600" />
              <p className="font-semibold text-sm">No messages yet</p>
              <p className="text-[11px] leading-relaxed">Start the discussion by typing in the input composer below.</p>
            </div>
          ) : (
            sortedComments.map((c) => {
              const isOwnComment = c.user_id === user.user_id;
              const commenterName = isOwnComment ? user.name : (c.user?.name || "User");
              const commenterInitials = commenterName.substring(0, 2).toUpperCase();
              const commenterRole = isOwnComment ? getRoleName(user.role) : getRoleName(c.user?.role || 3);

              return (
                <div
                  key={c.comment_id}
                  className={`flex gap-2.5 max-w-[90%] ${isOwnComment ? "self-end flex-row-reverse ml-auto" : "self-start mr-auto"}`}
                >
                  {!isOwnComment && (
                    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-neutral-300 uppercase">
                      {commenterInitials}
                    </div>
                  )}

                  <div className="flex flex-col">
                    <div className={`flex items-center gap-1.5 mb-0.5 text-[9px] text-neutral-500 ${isOwnComment ? "justify-end" : ""}`}>
                      <span className="font-semibold text-neutral-300">{commenterName}</span>
                      <span className="px-1.5 py-px text-[7px] bg-white/5 border border-white/10 rounded uppercase font-bold text-neutral-400">
                        {commenterRole}
                      </span>
                      <span>&middot;</span>
                      <span>
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap border ${
                      isOwnComment
                        ? "bg-[#252525] border-neutral-700 text-white rounded-tr-none"
                        : "bg-[#181818] border-white/10 text-neutral-200 rounded-tl-none"
                    }`}>
                      <p>{c.comment}</p>
                    </div>
                    
                    {c.isOptimistic ? (
                      <span className="text-[8px] text-neutral-600 italic self-end mt-0.5">Sending...</span>
                    ) : (
                      isOwnComment && (
                        <div className="flex items-center justify-end gap-0.5 mt-0.5">
                          <CheckCheck className="w-2.5 h-2.5 text-neutral-500" />
                          <span className="text-[8px] text-neutral-600 uppercase tracking-wider font-semibold">Sent</span>
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
        <div className="p-4 border-t border-white/10 bg-white/5 shrink-0">
          {canComment ? (
            <form onSubmit={handlePostComment} className="flex gap-2.5 items-center">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 focus-within:border-white/30 focus-within:bg-white/10 transition-all">
                <button
                  type="button"
                  onClick={() => showToast("Attachments not supported yet.", "info")}
                  className="text-neutral-400 hover:text-white transition-colors shrink-0"
                  title="Add Attachment"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1 bg-transparent border-none text-white text-xs focus:outline-none placeholder-neutral-500"
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
                className="w-9 h-9 rounded-full bg-white text-black hover:bg-neutral-200 transition-all flex items-center justify-center shrink-0 disabled:opacity-30 disabled:pointer-events-none hover:scale-105 active:scale-95 shadow-lg shadow-white/5"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center gap-2.5 text-neutral-500">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px]">
                {isAgent
                  ? (isClosedTicket ? "This ticket is closed." : agentCommentLockMessage)
                  : "You do not have permissions to post comments on this ticket."}
              </span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}


export default TicketDetails;
