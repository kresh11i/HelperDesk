import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Ticket, Book, Users, LifeBuoy } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { AuthContext } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard', roles: [1, 2, 3] },
    { icon: Ticket, label: 'Tickets', path: '/tickets', count: 5, roles: [1, 2, 3] },
    { icon: Book, label: 'Knowledge base', path: '/knowledge-base', roles: [1, 2, 3] },
    { icon: Users, label: 'Team', path: '/team', roles: [1, 2] },
  ].filter(item => item.roles.includes(user?.role));

  return (
    <GlassCard level={1} className="hidden md:flex flex-col w-64 h-[calc(100vh-2rem)] sticky top-4 m-4 p-6 border-r-0 rounded-3xl">
      <div className="flex items-center gap-3 mb-10 px-2">
        <LifeBuoy className="w-8 h-8 text-white" />
        <span className="font-semibold text-xl tracking-tight">HelperDesk</span>
      </div>

      <div className="text-xs font-semibold text-neutral-500 tracking-wider mb-4 px-2 uppercase">
        Workspace
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-white/10 text-white font-medium' 
                  : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 stroke-[1.5]" />
              <span>{item.label}</span>
            </div>
            {item.count && (
              <span className="text-xs font-medium text-neutral-500 group-hover:text-neutral-400 transition-colors">
                {item.count}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </GlassCard>
  );
};

export default Sidebar;
