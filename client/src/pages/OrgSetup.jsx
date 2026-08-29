import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { AlertCircle } from 'lucide-react';

function OrgSetup() {
  const navigate = useNavigate();
  const { updateToken, user } = useContext(AuthContext);
  
  const [orgName, setOrgName] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  
  const [errorCreate, setErrorCreate] = useState('');
  const [errorJoin, setErrorJoin] = useState('');

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setErrorCreate('');
    setLoadingCreate(true);
    
    try {
      const response = await api.post('/org/create', { organizationName: orgName });
      if (response.data && response.data.status === 201) {
        if (response.data.token) {
          updateToken(response.data.token);
        }
        navigate('/dashboard');
      } else {
        setErrorCreate(response.data?.message || 'Failed to create organization');
      }
    } catch (err) {
      setErrorCreate(err.response?.data?.message || 'An unexpected error occurred');
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleJoinOrg = async (e) => {
    e.preventDefault();
    setErrorJoin('');
    
    // Extract token from URL or use as is
    let tokenToUse = inviteUrl;
    try {
      if (inviteUrl.includes('http')) {
        const url = new URL(inviteUrl);
        const parts = url.pathname.split('/');
        // Assuming url is like http://domain/invite/:token
        tokenToUse = parts[parts.length - 1];
      }
    } catch (e) {
      // Ignore if not a valid URL, maybe they pasted just the token
    }
    
    if (!tokenToUse) {
      setErrorJoin('Please enter a valid invitation URL or token');
      return;
    }
    
    setLoadingJoin(true);
    try {
      const response = await api.post('/org/invite/accept', { token: tokenToUse });
      if (response.data && response.data.status === 201) {
        if (response.data.token) {
          updateToken(response.data.token);
        }
        navigate('/dashboard');
      } else {
        setErrorJoin(response.data?.message || 'Failed to accept invitation');
      }
    } catch (err) {
      setErrorJoin(err.response?.data?.message || 'An unexpected error occurred');
    } finally {
      setLoadingJoin(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-white text-black flex items-center justify-center rounded-xl mx-auto mb-6 font-bold text-xl shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            H
          </div>
          <h1 className="text-3xl font-semibold text-white mb-2">Welcome, {user?.name}!</h1>
          <p className="text-neutral-400 text-base">You need to join or create a workspace to continue.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Organization */}
          <GlassCard level={2} className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Create Organization</h2>
              <p className="text-sm text-neutral-400 mb-6">
                Start your own workspace and become the administrator. You can invite your team later.
              </p>
              
              <form onSubmit={handleCreateOrg} className="flex flex-col gap-4">
                {errorCreate && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {errorCreate}
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Organization Name</label>
                  <input 
                    type="text" 
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
                    placeholder="e.g. Acme Corp"
                    required
                  />
                </div>
                
                <Button variant="primary" className="w-full mt-2 py-3" type="submit" disabled={loadingCreate}>
                  {loadingCreate ? 'Creating...' : 'Create Organization'}
                </Button>
              </form>
            </div>
          </GlassCard>

          {/* Join Organization */}
          <GlassCard level={2} className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Join Organization</h2>
              <p className="text-sm text-neutral-400 mb-6">
                Paste the invitation URL provided by your administrator to join an existing workspace.
              </p>
              
              <form onSubmit={handleJoinOrg} className="flex flex-col gap-4">
                {errorJoin && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {errorJoin}
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Invitation URL</label>
                  <input 
                    type="text" 
                    value={inviteUrl}
                    onChange={(e) => setInviteUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
                    placeholder="https://.../invite/xyz..."
                    required
                  />
                </div>
                
                <Button variant="secondary" className="w-full mt-2 py-3" type="submit" disabled={loadingJoin}>
                  {loadingJoin ? 'Joining...' : 'Join Organization'}
                </Button>
              </form>
            </div>
          </GlassCard>
        </div>
        
      </div>
    </div>
  );
}

export default OrgSetup;
