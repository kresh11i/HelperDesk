import { useMemo, useState, useRef } from 'react';
import GlassCard from '../ui/GlassCard';
import { PieChart as PieChartIcon, MoreHorizontal } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, useInView } from 'framer-motion';

const MotionGlassCard = motion(GlassCard);

function TicketStatusChart({ tickets }) {
  const chartRef = useRef(null);
  const isInView = useInView(chartRef, { once: false, amount: 0.3 });
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const totalCount = tickets?.length || 0;

  const statusCounts = useMemo(() => {
    const counts = { open: 0, inProgress: 0, resolved: 0, closed: 0 };
    tickets?.forEach(t => {
      const s = t.status?.toLowerCase();
      if (s === 'open' || s === 'reopened') counts.open++;
      else if (s === 'in progress' || s === 'assigned') counts.inProgress++;
      else if (s === 'resolved') counts.resolved++;
      else if (s === 'closed') counts.closed++;
      else counts.open++;
    });
    return counts;
  }, [tickets]);

  const stats = [
    { key: 'open', label: 'Open', value: statusCounts.open, color: '#34D399' },
    { key: 'inProgress', label: 'In Progress', value: statusCounts.inProgress, color: '#60A5FA' },
    { key: 'resolved', label: 'Resolved', value: statusCounts.resolved, color: '#C084FC' },
    { key: 'closed', label: 'Closed', value: statusCounts.closed, color: '#94A3B8' },
  ];

  const chartData = totalCount > 0 ? stats.filter(s => s.value > 0) : [{ key: 'empty', label: 'Empty', value: 1, color: 'rgba(255,255,255,0.05)' }];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length && totalCount > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1C1C1C]/95 border border-white/10 rounded-lg p-2.5 shadow-2xl backdrop-blur-md flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }}></div>
          <span className="text-xs font-medium text-white">{data.label}: {data.value}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <MotionGlassCard
      ref={chartRef}
      level={1}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      className="p-0 flex flex-col h-full bg-[#0d0d0d] border border-white/5 overflow-hidden"
    >
      {/* Header section */}
      <div className="p-5 pb-0">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-[#10b981]" />
            <h2 className="text-lg font-medium text-white tracking-wide">Summary</h2>
          </div>
          <button className="text-neutral-500 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[13px] text-neutral-500 font-medium mt-1">
          Ticket distribution by status
        </p>
      </div>

      <div className="flex-1 flex items-center justify-between p-5 mt-4 gap-8">
        {/* SVG Donut */}
        <div className="relative w-[160px] h-[160px] flex items-center justify-center shrink-0 ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart key={isInView ? 'visible' : 'hidden'}>
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                isAnimationActive={isInView}
                animationBegin={500}
                animationDuration={1000}
                animationEasing="ease-out"
                stroke="none"
                onMouseEnter={(_, index) => setHoveredSegment(chartData[index]?.key)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="transition-all duration-300 outline-none"
                    style={{
                      opacity: hoveredSegment && hoveredSegment !== entry.key && totalCount > 0 ? 0.4 : 1,
                      filter: hoveredSegment === entry.key && totalCount > 0 ? 'brightness(1.1)' : 'none'
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center Info Text */}
          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[32px] font-semibold tracking-tight text-white leading-none">
              {totalCount}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 flex flex-col justify-center gap-3">
          {stats.map((seg) => {
            const displayPercent = totalCount > 0 ? Math.round((seg.value / totalCount) * 100) : 0;
            const isHovered = hoveredSegment === seg.key;
            return (
              <div
                key={seg.key}
                className={`flex items-center justify-between transition-opacity duration-200 cursor-pointer ${hoveredSegment && !isHovered && totalCount > 0 ? 'opacity-40' : 'opacity-100'}`}
                onMouseEnter={() => setHoveredSegment(seg.key)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-[13px] font-medium text-neutral-300">
                    {seg.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-semibold text-white">
                    {displayPercent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MotionGlassCard>
  );
}

export default TicketStatusChart;
