import React from 'react';
import GlassCard from '../ui/GlassCard';
import { Users, AlertCircle, Play, CheckCircle2 } from 'lucide-react';

function TicketStats({ openCount, inProgressCount, resolvedCount, totalCount, totalUsers, showUsers }) {
  const statsItems = [
    {
      label: 'Open / Reopened',
      value: openCount,
      desc: 'requires response',
      icon: AlertCircle,
      colorClass: 'text-blue-400',
    },
    {
      label: 'Active Progress',
      value: inProgressCount,
      desc: 'currently working',
      icon: Play,
      colorClass: 'text-amber-400',
    },
    {
      label: 'Resolved',
      value: resolvedCount,
      desc: 'tickets closed',
      icon: CheckCircle2,
      colorClass: 'text-emerald-400',
    },
  ];

  if (showUsers) {
    statsItems.push({
      label: 'Total Users',
      value: totalUsers,
      desc: 'registered accounts',
      icon: Users,
      colorClass: 'text-neutral-400',
    });
  } else {
    statsItems.push({
      label: 'Total Tickets',
      value: totalCount,
      desc: 'logged lifetime',
      icon: Play,
      colorClass: 'text-neutral-400',
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <GlassCard key={idx} level={1} className="p-5 flex flex-col justify-between min-h-[120px] relative group hover:scale-[1.01]">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold tracking-widest text-neutral-500 uppercase">{item.label}</span>
              <Icon className={`w-3.5 h-3.5 ${item.colorClass} opacity-60 group-hover:opacity-100 transition-opacity`} />
            </div>
            <div className="mt-3">
              <div className="text-3xl font-light tracking-tighter text-white">
                {String(item.value).padStart(2, '0')}
              </div>
              <p className="text-[10px] text-neutral-500 mt-1 font-medium">{item.desc}</p>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

export default TicketStats;
