import React from 'react';
import { Paperclip, Send, Lock } from 'lucide-react';

function MessageComposer({ value, onChange, onSubmit, canComment, isAgent, onAttachment }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSubmit(e);
    }
  };

  if (!canComment) {
    return (
      <div className="p-3 border-t border-white/10 bg-white/5 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/5 rounded-2xl text-neutral-500">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs">
            {isAgent ? 'Assign this ticket to yourself to reply.' : 'Comments locked.'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-white/10 bg-white/5 shrink-0">
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        {/* Input row */}
        <div className="flex-1 flex items-center gap-2 bg-white/7 border border-white/10 rounded-2xl px-3.5 py-2.5 focus-within:border-white/25 focus-within:bg-white/10 transition-all"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          {/* Attachment */}
          <button
            type="button"
            onClick={onAttachment}
            className="text-neutral-500 hover:text-white transition-colors shrink-0 cursor-pointer"
            title="Add Attachment"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none placeholder-neutral-500 min-w-0"
            autoComplete="off"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!value.trim()}
          className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center shrink-0 disabled:opacity-30 disabled:pointer-events-none shadow-lg cursor-pointer"
          title="Send"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );
}

export default MessageComposer;
