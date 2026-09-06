import React, { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { inviteUser, updateRole } from '../services/orgService';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Shield, User, UserPlus, Mail, X, Check, CheckCircle2, ChevronDown } from 'lucide-react';

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
  const [inviteRoleMenuOpen, setInviteRoleMenuOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState('idle');

  // Manage Role Modal State
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [manageRole, setManageRole] = useState(2);
  const [manageRoleMenuOpen, setManageRoleMenuOpen] = useState(false);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState('');
  const manageRoleTriggerRef = useRef(null);
  const manageRoleOptionRefs = useRef([]);

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
        setCopyStatus('idle');
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
    setInviteRoleMenuOpen(false);
    setCopyStatus('idle');
  };

  const invitationUrl = generatedToken ? `${window.location.origin}/invite/${generatedToken}` : '';

  const handleCopyInvitationUrl = async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard access is unavailable');
      await navigator.clipboard.writeText(invitationUrl);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }

    window.setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const openManageModal = (member) => {
    if (member.user_id === user.user_id) return; // Prevent managing own role
    setSelectedMember(member);
    setManageRole(member.role);
    setManageRoleMenuOpen(false);
    setManageModalOpen(true);
  };

  const manageRoleOptions = [
    { value: 1, label: 'Admin' },
    { value: 2, label: 'Agent' },
    { value: 3, label: 'User' },
  ];

  const selectManageRole = (role) => {
    setManageRole(String(role));
    setManageRoleMenuOpen(false);
  };

  const handleManageRoleTriggerKeyDown = (event) => {
    const currentIndex = manageRoleOptions.findIndex((role) => role.value === Number(manageRole));
    if (event.key === 'Escape') {
      setManageRoleMenuOpen(false);
      return;
    }

    const nextIndex = {
      ArrowDown: Math.min(currentIndex + 1, manageRoleOptions.length - 1),
      ArrowUp: Math.max(currentIndex - 1, 0),
      Home: 0,
      End: manageRoleOptions.length - 1,
    }[event.key];

    if (nextIndex === undefined) return;

    event.preventDefault();
    setManageRole(String(manageRoleOptions[nextIndex].value));
    setManageRoleMenuOpen(true);
  };

  const handleManageRoleOptionKeyDown = (event, index) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectManageRole(manageRoleOptions[index].value);
      manageRoleTriggerRef.current?.focus();
      return;
    }

    if (event.key === 'Escape') {
      setManageRoleMenuOpen(false);
      manageRoleTriggerRef.current?.focus();
      return;
    }

    const nextIndex = {
      ArrowDown: Math.min(index + 1, manageRoleOptions.length - 1),
      ArrowUp: Math.max(index - 1, 0),
      Home: 0,
      End: manageRoleOptions.length - 1,
    }[event.key];

    if (nextIndex === undefined) return;

    event.preventDefault();
    setManageRole(String(manageRoleOptions[nextIndex].value));
    manageRoleOptionRefs.current[nextIndex]?.focus();
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
                  <div className="rounded-lg border border-white/10 bg-black/40 p-3 break-all text-left text-xs font-mono text-blue-300">
                    {invitationUrl}
                  </div>
                  {copyStatus === 'error' && <p className="mt-2 text-left text-[10px] text-red-400">Unable to copy the link. Please copy it manually.</p>}
                </div>
                <div className="flex w-full flex-col gap-3">
                  <Button variant="secondary" type="button" className="w-full" onClick={handleCopyInvitationUrl}>
                    {copyStatus === 'copied' ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button variant="secondary" className="w-full" onClick={closeInviteModal}>Done</Button>
                </div>
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
                  <div className="relative">
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={inviteRoleMenuOpen}
                      onClick={() => setInviteRoleMenuOpen((isOpen) => !isOpen)}
                      className="flex w-full items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white transition-colors hover:bg-white/10 focus:outline-none focus:border-white/30"
                    >
                      <span>{Number(inviteRole) === 2 ? 'Agent' : 'User'}</span>
                      <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${inviteRoleMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {inviteRoleMenuOpen && (
                      <div role="listbox" aria-label="Role" className="mt-2 flex w-full flex-col gap-1 overflow-hidden rounded border border-white/10 bg-[#171717] p-1 shadow-xl shadow-black/30">
                        {[
                          { value: 2, label: 'Agent' },
                          { value: 3, label: 'User' },
                        ].map((role) => {
                          const isSelected = Number(inviteRole) === role.value;
                          return (
                            <button
                              key={role.value}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                setInviteRole(String(role.value));
                                setInviteRoleMenuOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm transition-colors ${isSelected ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/10 hover:text-white'}`}
                            >
                              {role.label}
                              {isSelected && <Check className="w-4 h-4 text-neutral-300" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
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
                <div className="relative">
                  <button
                    ref={manageRoleTriggerRef}
                    type="button"
                    aria-haspopup="listbox"
                    aria-controls="manage-role-options"
                    aria-expanded={manageRoleMenuOpen}
                    onClick={() => setManageRoleMenuOpen((isOpen) => !isOpen)}
                    onKeyDown={handleManageRoleTriggerKeyDown}
                    className="flex w-full items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white transition-colors hover:bg-white/10 focus:outline-none focus:border-white/30"
                  >
                    <span>{manageRoleOptions.find((role) => role.value === Number(manageRole))?.label}</span>
                    <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${manageRoleMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {manageRoleMenuOpen && (
                    <div id="manage-role-options" role="listbox" aria-label="Change Role" className="mt-2 flex w-full flex-col gap-1 overflow-hidden rounded border border-white/10 bg-[#171717] p-1 shadow-xl shadow-black/30">
                      {manageRoleOptions.map((role, index) => {
                        const isSelected = Number(manageRole) === role.value;
                        return (
                          <button
                            key={role.value}
                            ref={(element) => { manageRoleOptionRefs.current[index] = element; }}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => selectManageRole(role.value)}
                            onKeyDown={(event) => handleManageRoleOptionKeyDown(event, index)}
                            className={`flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm transition-colors ${isSelected ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/10 hover:text-white'}`}
                          >
                            {role.label}
                            {isSelected && <Check className="w-4 h-4 text-neutral-300" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
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
