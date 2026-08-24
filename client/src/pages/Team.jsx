import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { inviteUser, updateRole } from '../services/orgService';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Shield, User, UserPlus, Mail, X, CheckCircle2 } from 'lucide-react';

function Team() {
  const { user } = useContext(AuthContext);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState(2); // Default to Agent
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [generatedToken, setGeneratedToken] = useState(null);

  // Manage Role Modal State
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [manageRole, setManageRole] = useState(2);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState('');

  const fetchTeam = async () => {
    try {
      const response = await fetch('http://localhost:3000/org/team', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setTeamMembers(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load team directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 1 || user?.role === 2) {
      fetchTeam();
    }
  }, [user]);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError('');
    setGeneratedToken(null);
    
    try {
      const res = await inviteUser(inviteEmail, parseInt(inviteRole));
      if (res.status === 201) {
        setGeneratedToken(res.token);
        setInviteEmail('');
      } else {
        setInviteError(res.message || 'Failed to send invitation');
      }
    } catch (err) {
      setInviteError('An unexpected error occurred');
    } finally {
      setInviteLoading(false);
    }
  };

  const closeInviteModal = () => {
    setInviteModalOpen(false);
    setGeneratedToken(null);
    setInviteError('');
    setInviteEmail('');
  };

  const openManageModal = (member) => {
    if (member.user_id === user.user_id) return; // Prevent managing own role
    setSelectedMember(member);
    setManageRole(member.role);
    setManageModalOpen(true);
  };

  const handleManageSubmit = async (e) => {
    e.preventDefault();
    setManageLoading(true);
    setManageError('');
    try {
      const res = await updateRole(selectedMember.user_id, parseInt(manageRole));
      if (res.status === 200) {
        setManageModalOpen(false);
        fetchTeam();
      } else {
        setManageError(res.message || 'Failed to update role');
      }
    } catch (err) {
      setManageError('An unexpected error occurred');
    } finally {
      setManageLoading(false);
    }
  };

  // RBAC check
  if (user?.role === 3) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10">
        <Shield className="w-16 h-16 text-neutral-600 mb-4" />
        <h1 className="text-2xl font-semibold text-white mb-2">Access Denied</h1>
        <p className="text-neutral-400 max-w-md">You do not have permission to view the team directory. This page is restricted to Agents and Administrators.</p>
      </div>
    );
  }

  const getRoleName = (roleId) => {
    if (roleId === 1) return 'Admin';
    if (roleId === 2) return 'Agent';
    return 'User';
  };

  return (
    <div className="flex flex-col gap-6 pb-8 h-full pt-4 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h2 className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase mb-1">Organization</h2>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Team Directory</h1>
        </div>
        
        {user?.role === 1 && (
          <Button variant="primary" className="flex items-center gap-2" onClick={() => setInviteModalOpen(true)}>
            <UserPlus className="w-4 h-4" /> Invite Member
          </Button>
        )}
      </div>

      <GlassCard level={1} className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-400">Loading team...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">{error}</div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-semibold tracking-widest text-neutral-500 uppercase bg-white/5">
                <th className="p-4 rounded-tl-lg">Member</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 rounded-tr-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.user_id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10 text-sm font-semibold">
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{member.name}</p>
                        <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {member.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-widest uppercase bg-white/10 text-neutral-300 border border-white/10">
                      {getRoleName(member.role)}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={'open'} className="capitalize text-[10px] px-2">
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 bg-green-400`}></span>
                      Active
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    {user?.role === 1 ? (
                      member.user_id !== user.user_id ? (
                        <button onClick={() => openManageModal(member)} className="text-xs text-neutral-400 hover:text-white transition-colors">Manage</button>
                      ) : (
                        <span className="text-xs text-neutral-600 italic">You</span>
                      )
                    ) : (
                      <span className="text-xs text-neutral-600">No access</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </GlassCard>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard level={2} className="w-full max-w-md p-6 relative">
            <button onClick={closeInviteModal} className="absolute top-4 right-4 text-neutral-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-white mb-6">Invite Team Member</h2>
            
            {generatedToken ? (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
                <div>
                  <p className="text-white font-medium mb-2">Invitation Created!</p>
                  <p className="text-sm text-neutral-400 mb-4">Share this link with the new member:</p>
                  <div className="bg-black/40 border border-white/10 rounded-lg p-3 break-all text-xs text-blue-300 font-mono">
                    {window.location.origin}/invite/{generatedToken}
                  </div>
                </div>
                <Button variant="secondary" className="w-full mt-4" onClick={closeInviteModal}>Done</Button>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4">
                {inviteError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded text-center">
                    {inviteError}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Email Address</label>
                  <input 
                    type="email" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-white/30"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Role</label>
                  <select 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-white/30"
                  >
                    <option value={2}>Agent</option>
                    <option value={3}>User</option>
                  </select>
                  <p className="text-[10px] text-neutral-500 mt-1">Agents can manage and reply to tickets. Users can only view their own tickets.</p>
                </div>
                <Button variant="primary" type="submit" disabled={inviteLoading} className="w-full mt-2">
                  {inviteLoading ? 'Sending...' : 'Create Invitation'}
                </Button>
              </form>
            )}
          </GlassCard>
        </div>
      )}

      {/* Manage Role Modal */}
      {manageModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard level={2} className="w-full max-w-md p-6 relative">
            <button onClick={() => setManageModalOpen(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-white mb-6">Manage Member</h2>
            
            <form onSubmit={handleManageSubmit} className="flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10 text-sm font-semibold text-white">
                  {selectedMember.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{selectedMember.name}</p>
                  <p className="text-xs text-neutral-400">{selectedMember.email}</p>
                </div>
              </div>
              
              {manageError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded text-center">
                  {manageError}
                </div>
              )}
              
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">Change Role</label>
                <select 
                  value={manageRole}
                  onChange={(e) => setManageRole(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-white/30"
                >
                  <option value={1}>Admin</option>
                  <option value={2}>Agent</option>
                  <option value={3}>User</option>
                </select>
                <p className="text-[10px] text-neutral-500 mt-1">WARNING: Changing a member to an Admin will give them full access to all organization settings and tickets.</p>
              </div>
              
              <Button variant="primary" type="submit" disabled={manageLoading} className="w-full mt-2">
                {manageLoading ? 'Updating...' : 'Save Changes'}
              </Button>
            </form>
          </GlassCard>
        </div>
      )}

    </div>
  );
}

export default Team;
