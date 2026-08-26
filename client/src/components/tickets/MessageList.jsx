import React, { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import MessageBubble from './MessageBubble';

function getDateLabel(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function MessageList({ comments, currentUserId, getRoleName, loading }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <span className="text-xs">Loading messages…</span>
        </div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-500 gap-3 p-6 select-none">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
          💬
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-300">No messages yet</p>
          <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">Start the conversation with the requester.</p>
        </div>
      </div>
    );
  }

  // Group messages by date for sticky date dividers
  let lastDateLabel = null;

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10">
      {comments.map((c) => {
        const isOwn = c.user_id === currentUserId;
        const commenterName = isOwn ? (c.user?.name || 'You') : (c.user?.name || 'User');
        const commenterRole = isOwn
          ? getRoleName(c.user?.role)
          : getRoleName(c.user?.role || 3);

        // Date divider
        const dateLabel = c.created_at ? getDateLabel(c.created_at) : null;
        const showDateDivider = dateLabel && dateLabel !== lastDateLabel;
        if (showDateDivider) lastDateLabel = dateLabel;

        return (
          <React.Fragment key={c.comment_id}>
            {showDateDivider && (
              <div className="flex items-center gap-3 my-1 select-none">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[9px] text-neutral-500 font-medium px-2 py-0.5 bg-white/5 rounded-full border border-white/5">
                  {dateLabel}
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
            )}
            <MessageBubble
              comment={c}
              isOwn={isOwn}
              userName={commenterName}
              userRole={commenterRole}
            />
          </React.Fragment>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

export default MessageList;
