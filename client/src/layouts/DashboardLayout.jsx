import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import BottomNav from '../components/navigation/BottomNav';
import { Search, Bell, LogOut, User, Settings, CheckCircle2 } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';

function DashboardLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] text-white flex">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-24">
        {/* Top Header - Mobile & Desktop */}
        <header className="z-40 flex items-center justify-between px-6 py-6 md:px-10">
          <div className="flex-1">
            {/* Context/Date could go here if needed, keeping it clean for now */}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-hover:text-white transition-colors" />
              <input 
                type="text"
                placeholder="Search workspace"
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 w-64"
              />
            </div>
            
            {/* Notification Dropdown */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/20 hover:scale-105 transition-all duration-200 relative"
              >
                <Bell className="w-4 h-4 text-neutral-300" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-pulse"></span>
              </button>
              
              {notifOpen && (
                <GlassCard level={3} className="absolute right-0 top-14 w-80 p-0 flex flex-col z-50 animate-in fade-in slide-in-from-top-4 duration-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    <button className="text-[10px] text-neutral-400 hover:text-white uppercase tracking-wider">Mark all read</button>
                  </div>
                  
                  <div className="flex flex-col max-h-80 overflow-y-auto scrollbar-hide">
                    {/* Mock Notifications */}
                    <div className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-neutral-200"><span className="text-white font-medium">System Update</span> installed successfully.</p>
                        <p className="text-xs text-neutral-500 mt-1">2 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        AL
                      </div>
                      <div>
                        <p className="text-sm text-neutral-200"><span className="text-white font-medium">Alex Rivera</span> mentioned you in Ticket #1024.</p>
                        <p className="text-xs text-neutral-500 mt-1">5 hours ago</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2 border-t border-white/10 bg-white/5">
                    <button className="w-full py-1.5 text-xs text-center text-neutral-400 hover:text-white transition-colors">View all activity</button>
                  </div>
                </GlassCard>
              )}
            </div>
            
            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-full bg-white text-black font-semibold text-sm flex items-center justify-center hover:bg-neutral-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                {getInitials(user?.name)}
              </button>
              
              {dropdownOpen && (
                <GlassCard level={3} className="absolute right-0 top-14 w-60 p-2 flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                  <div className="px-3 py-3 border-b border-white/10 mb-1">
                    <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-widest uppercase bg-white/10 text-neutral-300 border border-white/10">
                      {user?.role === 1 ? 'Admin' : user?.role === 2 ? 'Agent' : 'User'}
                    </div>
                  </div>
                  
                  <button onClick={() => { setDropdownOpen(false); navigate('/account'); }} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left">
                    <User className="w-4 h-4" /> Account Settings
                  </button>
                  
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left mt-1">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </GlassCard>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 px-6 md:px-10 max-w-[1600px] w-full mx-auto relative">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default DashboardLayout;