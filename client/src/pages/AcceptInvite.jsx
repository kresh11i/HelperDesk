import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { acceptInvite } from '../services/orgService';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { CheckCircle2, AlertCircle } from 'lucide-react';

function AcceptInvite() {
  const navigate = useNavigate();
  const { token } = useParams();
  
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      const response = await acceptInvite(token, name, password);
      
      if (response.status === 201) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.message || 'Failed to accept invitation. It may be expired or invalid.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <div className="w-full max-w-sm flex flex-col gap-6">
        
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-white text-black flex items-center justify-center rounded-xl mx-auto mb-6 font-bold text-xl shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            H
          </div>
          <h1 className="text-2xl font-semibold text-white mb-1">Accept Invitation</h1>
          <p className="text-neutral-400 text-sm">Join your team's workspace</p>
        </div>

        <GlassCard level={2} className="p-6 md:p-8">
          {success ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-green-400 mb-2" />
              <h2 className="text-xl font-semibold text-white">Invitation Accepted!</h2>
              <p className="text-sm text-neutral-400 mb-4">Your account has been created successfully.</p>
              <Button variant="primary" onClick={() => navigate('/login')} className="w-full">
                Go to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
                  required
                />
              </div>

              <Button variant="primary" className="w-full mt-4 py-3 relative" type="submit" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></span>
                    Accepting...
                  </span>
                ) : 'Join Workspace'}
              </Button>
            </form>
          )}
        </GlassCard>

        <div className="text-center mt-2">
          <p className="text-sm text-neutral-400">
            Already have an account? <button onClick={() => navigate('/login')} className="text-white font-medium hover:underline">Sign In</button>
          </p>
        </div>

      </div>
    </div>
  );
}

export default AcceptInvite;
