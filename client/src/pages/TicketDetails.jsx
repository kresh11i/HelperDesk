import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { ToastContext } from "../contexts/ToastContext";
import {
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

  const isAssignedToMe = ticket && ticket.assigned_to === user?.name;
  const isCreatorOfTicket = ticket && ticket.created_by === user?.user_id;

  // Authorization flags
  const canManageStatus = isAdmin || (isAgent && isAssignedToMe);
  const canEditTicket = isAdmin || (isAgent && isAssignedToMe);
  const canDeleteTicket = isAdmin;
  const canComment =
    isAdmin || (isAgent && isAssignedToMe) || (isEndUser && isCreatorOfTicket);

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
      <div className="flex h-full items-center justify-center text-neutral-400">
        Loading ticket...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-neutral-400 gap-4">
        <p>{ticketError || "Failed to load ticket details."}</p>

        <Button variant="secondary" onClick={() => navigate("/tickets")}>
          Back to Queue
        </Button>
      </div>
    );
  }

  const nextTransitions = allowedTransitions[ticket.status] || [];
  const validTransitions = nextTransitions.filter((state) => {
    if (state === "Closed" || state === "Reopened") {
      return isAdmin; // Closed/Reopened restricted to Admin in backend
    }
    return true;
  });

  const getRoleName = (roleNum) => {
    if (roleNum === 1) return "Admin";
    if (roleNum === 2) return "Agent";
    return "Customer";
  };

  return (
    <div className="flex flex-col gap-6 pb-12 h-full max-w-5xl mx-auto w-full pt-4 md:pt-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/tickets")}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Queue
        </button>

        <div className="flex items-center gap-2">
          {canEditTicket && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
          )}
          {canDeleteTicket && (
            <button
              onClick={handleDelete}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6">
          <GlassCard level={1} className="p-6 md:p-8 flex flex-col gap-6">
            {isEditing ? (
              // Inline Edit Mode
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">
                    Ticket Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">
                    Description
                  </label>
                  <textarea
                    rows={6}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {["Low", "Medium", "High"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setEditPriority(p)}
                        className={`px-4 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
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

                <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditTitle(ticket.title);
                      setEditDescription(ticket.description);
                      setEditPriority(ticket.priority);
                    }}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="text-xs bg-white text-black font-semibold px-4 py-2 rounded-lg hover:bg-neutral-200"
                    disabled={updating}
                  >
                    {updating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              // Display Mode
              <>
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-neutral-500">
                        #{String(ticket.ticket_id).slice(-4)}
                      </span>
                      <Badge
                        variant={ticket.priority?.toLowerCase() || "medium"}
                        className="capitalize"
                      >
                        {ticket.priority}
                      </Badge>
                      <Badge
                        variant={
                          ticket.status?.toLowerCase() === "open"
                            ? "open"
                            : ticket.status?.toLowerCase() === "closed" ||
                                ticket.status?.toLowerCase() === "resolved"
                              ? "resolved"
                              : "inProgress"
                        }
                        className="capitalize"
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
                      {ticket.title}
                    </h1>
                  </div>
                </div>

                <div className="text-neutral-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                  {ticket.description}
                </div>
              </>
            )}
          </GlassCard>

          {/* Conversation Thread */}
          <h3 className="text-sm font-semibold tracking-widest text-neutral-500 uppercase mt-4 mb-2">
            Conversation
          </h3>

          <GlassCard
            level={2}
            className="p-6 flex flex-col gap-6 min-h-[350px]"
          >
            {commentsLoading ? (
              <div className="flex-1 flex items-center justify-center text-neutral-500 text-xs">
                Loading conversation...
              </div>
            ) : comments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-500 p-8 gap-2">
                <MessageSquare className="w-10 h-10 stroke-[1.2] text-neutral-600" />
                <div>
                  <p className="font-semibold text-neutral-400 text-sm">
                    No messages yet
                  </p>
                  <p className="text-xs">
                    Start the conversation by typing in the input composer
                    below.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[380px] flex flex-col gap-4 pr-2">
                {sortedComments.map((c) => {
                  const isOwnComment = c.user_id === user.user_id;
                  const commenterRole = getRoleName(c.user?.role);
                  return (
                    <div
                      key={c.comment_id}
                      className={`flex gap-3 max-w-[85%] ${isOwnComment ? "self-end flex-row-reverse" : "self-start"}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0 text-xs font-bold text-neutral-300 uppercase">
                        {(c.user?.name || "U").substring(0, 2)}
                      </div>

                      <div className="flex flex-col">
                        <div
                          className={`flex items-center gap-2 mb-1 text-[10px] text-neutral-500 ${isOwnComment ? "justify-end" : ""}`}
                        >
                          <span className="font-medium text-neutral-300">
                            {c.user?.name || "User"}
                          </span>
                          <span className="px-1.5 py-px text-[8px] bg-white/5 border border-white/10 rounded uppercase font-bold text-neutral-400">
                            {commenterRole}
                          </span>
                          <span>&middot;</span>
                          <span>
                            {new Date(c.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-sm ${
                            isOwnComment
                              ? "bg-white text-black rounded-tr-none"
                              : "bg-white/5 border border-white/5 text-neutral-200 rounded-tl-none"
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">
                            {c.comment}
                          </p>
                        </div>
                        {c.isOptimistic && (
                          <span className="text-[9px] text-neutral-600 italic self-end mt-0.5">
                            Sending...
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={commentsEndRef} />
              </div>
            )}

            {/* Comment Input Composer */}
            <div className="pt-4 border-t border-white/10">
              {canComment ? (
                <form onSubmit={handlePostComment} className="flex gap-3">
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handlePostComment(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || updating}
                    className="w-12 h-12 rounded-xl bg-white text-black hover:bg-neutral-200 transition-all flex items-center justify-center shrink-0 disabled:opacity-30 disabled:pointer-events-none hover:scale-105 active:scale-95 shadow-lg shadow-white/5"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center gap-3 text-neutral-500">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span className="text-xs">
                    {isAgent
                      ? "You must self-assign this ticket to join the conversation."
                      : "You do not have permissions to post comments on this ticket."}
                  </span>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Sidebar Details Area */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          <GlassCard level={2} className="p-6 flex flex-col gap-6">
            {/* Status transitions (Admin / Assigned Agent only) */}
            {canManageStatus && validTransitions.length > 0 && (
              <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
                <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">
                  Context Actions
                </span>
                <div className="flex flex-col gap-2 mt-2">
                  {validTransitions.map((state) => {
                    let label = `Set ${state}`;
                    let icon = <Play className="w-3.5 h-3.5" />;
                    let variant = "secondary";

                    if (state === "In Progress") {
                      label = "Start Work";
                      icon = <Play className="w-3.5 h-3.5" />;
                    } else if (state === "Resolved") {
                      label = "Resolve Ticket";
                      icon = (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      );
                    } else if (state === "Closed") {
                      label = "Close Ticket";
                      icon = <X className="w-3.5 h-3.5 text-neutral-400" />;
                    } else if (state === "Reopened") {
                      label = "Reopen Ticket";
                      icon = (
                        <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                      );
                    } else if (state === "Assigned") {
                      label = "Assign Action";
                    }

                    return (
                      <Button
                        key={state}
                        variant={variant}
                        onClick={() => handleStatusTransition(state)}
                        disabled={updating}
                        className="w-full text-xs font-semibold py-2.5 justify-start text-left bg-white/5 border border-white/10 hover:bg-white/10"
                      >
                        <span className="mr-2 shrink-0">{icon}</span> {label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-5">
              {/* Assignee display and UI controls */}
              <div>
                <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase block mb-1">
                  Assignee
                </span>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-white font-medium">
                      {ticket.assigned_to || "Unassigned"}
                    </span>
                  </div>

                  {/* Agents self-assignment action */}
                  {isAgent && !ticket.assigned_to && (
                    <button
                      onClick={handleSelfAssign}
                      disabled={updating}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors mt-1.5 self-start"
                    >
                      Assign to me
                    </button>
                  )}

                  {/* Admin assignment dropdown list */}
                  {isAdmin && !ticket.assigned_to && agents.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      <label className="text-[9px] font-semibold tracking-wider text-neutral-500 uppercase">
                        Assign Agent
                      </label>
                      <select
                        onChange={(e) => handleAdminAssign(e.target.value)}
                        disabled={updating}
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 capitalize font-medium"
                        defaultValue=""
                      >
                        <option value="" disabled className="bg-neutral-900">
                          Select...
                        </option>
                        {agents.map((a) => (
                          <option
                            key={a.user_id}
                            value={a.user_id}
                            className="bg-neutral-900"
                          >
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Requester display */}
              <div>
                <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase block mb-1">
                  Requester
                </span>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm text-white font-medium">
                    {ticket.created_user?.name || "Customer"}
                  </span>
                </div>
              </div>

              {/* Created Timestamp */}
              <div>
                <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase block mb-1">
                  Created
                </span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm text-white font-medium">
                    {new Date(ticket.created_at || Date.now()).toLocaleString(
                      [],
                      { dateStyle: "short", timeStyle: "short" },
                    )}
                  </span>
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
