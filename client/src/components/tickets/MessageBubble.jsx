import React from 'react';
import { CheckCheck } from 'lucide-react';

function MessageBubble({ comment, isOwn, userName, userRole, commentsEndRef }) {
  const initials = userName ? userName.substring(0, 2).toUpperCase() : 'U';
  const timeStr = comment.created_at
    ? new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse ml-auto' : 'mr-auto'} max-w-[85%] sm:max-w-[75%]`}>
      {/* Avatar (only for others) */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-auto text-[9px] font-bold text-neutral-300 uppercase">
          {initials}
        </div>
      )}

      <div className={`flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Name & role label */}
        <div className={`flex items-center gap-1.5 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] font-semibold text-neutral-300">{userName}</span>
          <span className="text-[8px] px-1 py-px bg-white/5 border border-white/10 rounded uppercase font-bold text-neutral-500">
            {userRole}
          </span>
        </div>

        {/* Message Bubble */}
        <div
          className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
            isOwn
              ? 'bg-blue-600/80 border border-blue-500/50 text-white rounded-tr-sm'
              : 'bg-white/7 border border-white/10 text-neutral-100 rounded-tl-sm'
          }`}
          style={isOwn ? {} : { background: 'rgba(255,255,255,0.06)' }}
        >
          {comment.comment}

          {/* Inline timestamp */}
          <div className={`flex items-center gap-1 mt-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[8px] opacity-50">{timeStr}</span>
            {isOwn && (
              comment.isOptimistic
                ? <span className="text-[8px] opacity-40 italic">Sending…</span>
                : <CheckCheck className="w-2.5 h-2.5 opacity-50" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
