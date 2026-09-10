import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { User, Mail, Shield, Building, Clock, LogOut, Edit2 } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';

function Account() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const roleName = user?.role === 1 ? 'Administrator' : user?.role === 2 ? 'Agent' : 'End User';

  return (
    <PageContainer maxWidth="lg">
      
      <div className="text-center mb-2">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Account</h1>
      </div>

      {/* Profile Card */}
      <GlassCard level={1} className="p-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-white text-black flex items-center justify-center rounded-2xl mb-4 font-bold text-2xl shadow-[0_0_20px_rgba(255,255,255,0.15)]">
          {getInitials(user?.name)}
        </div>
        <h2 className="text-xl font-medium text-white mb-1">{user?.name || 'User'}</h2>
        <p className="text-neutral-400 text-sm mb-4">{user?.email}</p>
        <Badge variant="medium" className="bg-white/10 text-white border-white/20 px-3 py-1 text-[10px] tracking-widest font-bold uppercase">
          {roleName}
        </Badge>
      </GlassCard>

      {/* Info Card */}
      <GlassCard level={2} className="flex flex-col">
        
        <div className="flex items-center gap-4 p-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 border border-white/10">
             <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase mb-0.5">Full Name</p>
            <p className="text-sm text-neutral-200">{user?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 border border-white/10">
             <Mail className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase mb-0.5">Email</p>
            <p className="text-sm text-neutral-200">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 border border-white/10">
             <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase mb-0.5">Role</p>
            <p className="text-sm text-neutral-200">{roleName}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 border border-white/10">
             <Building className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase mb-0.5">Organization</p>
            <p className="text-sm text-neutral-200">{user?.org_id || 'Acme Corp'}</p>
          </div>
        </div>

      </GlassCard>

      {/* Switch Role Card */}
      <GlassCard level={1} className="p-6">
        <div className="flex gap-4 mb-6">
          <Button variant="secondary" className="flex-1 py-2 text-xs">
            Edit Profile
          </Button>
          <Button variant="secondary" className="flex-1 py-2 text-xs">
            Change Password
          </Button>
        </div>

        <h3 className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase mb-2">Try Another Role</h3>
        <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
          Sign out and use a different demo account to see agent or admin views.
        </p>
        <Button variant="secondary" className="w-full py-3 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-300" onClick={handleSignOut}>
          Sign Out & Switch Role
        </Button>
      </GlassCard>

    </PageContainer>
  );
}

export default Account;
