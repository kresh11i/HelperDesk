import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

function CreateTicket() {
  const navigate = useNavigate();
  const [priority, setPriority] = useState('Medium');

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/tickets');
  };

  return (
    <div className="flex flex-col gap-6 pb-8 h-full max-w-2xl mx-auto w-full pt-4 md:pt-12">
      
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors self-start"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Tickets
      </button>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Create Ticket</h1>
        <p className="text-neutral-400">Tell us what you need help with.</p>
      </div>

      <GlassCard level={1} className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Title</label>
            <input 
              type="text" 
              placeholder="Brief summary of the issue"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">A clear summary helps our team respond faster.</p>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Description</label>
            <textarea 
              rows={5}
              placeholder="Describe the issue in detail. Include steps to reproduce, error messages, and what you expected to happen."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors resize-none"
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Priority</label>
            <div className="grid grid-cols-3 gap-3">
              {['Low', 'Medium', 'High'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-3 px-2 rounded-lg border flex flex-col items-center justify-center transition-all ${
                    priority === p 
                      ? 'bg-white text-black border-white' 
                      : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  <span className="font-semibold text-sm mb-0.5">{p}</span>
                  <span className={`text-[10px] ${priority === p ? 'text-neutral-700' : 'text-neutral-500'}`}>
                    {p === 'Low' ? 'Minor issue, can wait' : p === 'Medium' ? 'Affects work somewhat' : 'Urgent, blocking work'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-6 border-t border-white/10">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <Button variant="primary" type="submit" className="px-8 py-2.5">
              Create Ticket
            </Button>
          </div>

        </form>
      </GlassCard>

    </div>
  );
}

export default CreateTicket;
