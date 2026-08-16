import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Ticket, Plus, User, Users } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { AuthContext } from '../../contexts/AuthContext';

const BottomNav = () => {
  const { user } = useContext(AuthContext);
  
  const isEndUser = user?.role === 3;

  const navItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
    { icon: Ticket, label: 'Tickets', path: '/tickets' },
    isEndUser
      ? { icon: Plus, label: 'Create', path: '/create', primary: true }
      : { icon: Users, label: 'Team', path: '/team', primary: true },
    { icon: User, label: 'Account', path: '/account' },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-4">
      <GlassCard 
        level={3} 
        className="flex items-center justify-between px-2 py-1.5 rounded-full w-full max-w-sm scale-90 hover:scale-100 transition-transform duration-300 origin-bottom"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-12 rounded-full transition-all duration-300 hover:-translate-y-1 ${
                item.primary 
                  ? 'bg-white text-black hover:bg-neutral-200'
                  : isActive
                    ? 'bg-white/10 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  className={`w-5 h-5 ${!item.primary && 'mb-0.5'} ${item.primary ? 'stroke-[2.5]' : isActive ? 'stroke-[2]' : 'stroke-[1.5]'}`} 
                />
                {!item.primary && (
                  <span className={`text-[9px] ${isActive ? 'font-medium' : 'font-normal'}`}>
                    {item.label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </GlassCard>
    </div>
  );
};

export default BottomNav;
