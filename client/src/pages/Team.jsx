import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Shield, User, UserPlus, Mail } from 'lucide-react';

function Team() {
  const { user } = useContext(AuthContext);

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

  const teamMembers = [
    { id: 1, name: 'Alice Admin', email: 'alice@demo.com', role: 'Admin', active: true },
    { id: 2, name: 'Bob Support', email: 'bob@demo.com', role: 'Agent', active: true },
    { id: 3, name: 'Charlie Tech', email: 'charlie@demo.com', role: 'Agent', active: true },
    { id: 4, name: 'Diana Ops', email: 'diana@demo.com', role: 'Agent', active: false },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8 h-full pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h2 className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase mb-1">Organization</h2>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Team Directory</h1>
        </div>
        
        {user?.role === 1 && (
          <Button variant="primary" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Invite Member
          </Button>
        )}
      </div>

      <GlassCard level={1} className="overflow-hidden">
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
                <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
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
                      {member.role}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={member.active ? 'open' : 'closed'} className="capitalize text-[10px] px-2">
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${member.active ? 'bg-green-400' : 'bg-neutral-500'}`}></span>
                      {member.active ? 'Active' : 'Offline'}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    {user?.role === 1 ? (
                      <button className="text-xs text-neutral-400 hover:text-white transition-colors">Manage</button>
                    ) : (
                      <span className="text-xs text-neutral-600">No access</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

export default Team;
