import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';

function Register() {
  const navigate = useNavigate();
  // We'll mock the register flow. Real app would use a register function from AuthContext.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    
    // Mock registration delay
    setTimeout(() => {
      setLoading(false);
      // Mock success: redirect to login
      navigate('/login');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
      
      <div className="w-full max-w-sm flex flex-col gap-6">
        
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-white text-black flex items-center justify-center rounded-xl mx-auto mb-6 font-bold text-xl shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            H
          </div>
          <h1 className="text-2xl font-semibold text-white mb-1">Create an account</h1>
          <p className="text-neutral-400 text-sm">Join the workspace</p>
        </div>

        <GlassCard level={2} className="p-6 md:p-8">
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center">
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
              <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  Creating Account...
                </span>
              ) : 'Register'}
            </Button>
          </form>
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

export default Register;
