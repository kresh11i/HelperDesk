import { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import BottomNav from '../components/navigation/BottomNav';
import { LogOut, User } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

function DashboardLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [orgName, setOrgName] = useState(null);

  // Fetch organization name if user belongs to one
  useEffect(() => {
    const fetchOrgName = async () => {
      if (user?.org_id) {
        try {
          const { getCurrentOrganization } = await import('../services/orgService');
          const res = await getCurrentOrganization();
          if (res.status === 200 && res.data) {
            setOrgName(res.data.name);
          }
        } catch (error) {
          console.error("Failed to fetch organization name", error);
        }
      }
    };
    fetchOrgName();
  }, [user?.org_id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="h-[100dvh] flex flex-col gap-4 md:gap-8 bg-[var(--bg-dark)] text-white overflow-hidden relative">
      {/* Top Header - Mobile & Desktop */}
      <header className="z-40 flex items-center justify-between px-6 py-4 md:px-10 md:py-5 shrink-0">

        {/* Left: Brand */}
        <div className="w-1/3 flex items-center">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white text-black flex items-center justify-center font-bold text-xs">R</div>
            RELAY
          </h2>
        </div>

        {/* Center: Greeting & Date */}
        <div className="w-1/3 hidden md:flex items-center justify-center">
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-neutral-300">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}! 👋
            </span>
            <span className="text-xs text-neutral-500 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Right: Status & User */}
        <div className="w-1/3 flex items-center justify-end gap-6">
          {/* Workspace Context */}
          <div className="hidden lg:flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <span className="text-xs font-medium text-neutral-300 tracking-wide truncate max-w-[150px]">
              {orgName || 'Primary Workspace'}
            </span>
          </div>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-10 h-10 rounded-full bg-white text-black font-semibold text-sm flex items-center justify-center hover:bg-neutral-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              {getInitials(user?.name)}
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 top-14 w-60 z-50 origin-top-right rounded-2xl bg-[#111111] shadow-2xl"
                  style={{ backfaceVisibility: "hidden", WebkitFontSmoothing: "antialiased" }}
                >
                  <GlassCard level={3} className="p-2 flex flex-col gap-1 w-full">
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-w-0 scrollbar-hide ${location.pathname.startsWith('/tickets') ? 'overflow-hidden' : location.pathname.startsWith('/account') ? 'overflow-y-auto lg:overflow-y-auto' : `overflow-y-auto ${user?.role === 1 ? 'lg:overflow-y-auto' : 'lg:overflow-hidden'}`}`}>
        <div className={`flex-1 flex flex-col px-6 md:px-10 max-w-[1600px] w-full mx-auto relative ${location.pathname.startsWith('/tickets') ? 'min-h-0 md:min-h-0 pt-0 md:pt-0 pb-24 lg:pb-24' : 'pt-2 md:pt-4 pb-32 lg:pb-32'}`}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default DashboardLayout;