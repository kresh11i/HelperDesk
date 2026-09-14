import { useMemo, useRef } from 'react';
import GlassCard from '../ui/GlassCard';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart2, MoreHorizontal } from 'lucide-react';
import { motion, useInView } from 'framer-motion';

const MotionGlassCard = motion(GlassCard);

function TotalTicketsChart({ tickets }) {
  const chartRef = useRef(null);
  const isInView = useInView(chartRef, { once: false, amount: 0.3 });

  const { chartData, totalCreated, peakDay } = useMemo(() => {
    if (!tickets || tickets.length === 0) {
      return { chartData: [], totalCreated: 0, peakDay: { count: 0, label: 'N/A' } };
    }

    const today = new Date();
    // Use calendar day boundary for today
    today.setHours(23, 59, 59, 999);
    const msPerDay = 1000 * 60 * 60 * 24;

    // Arrays to hold counts: index 0 is 6 days ago, index 6 is today
    const currentCounts = [0, 0, 0, 0, 0, 0, 0];
    const data = [];
    let tCurr = 0;

    // Calculate boundary start (6 days ago at 00:00)
    const startDate = new Date(today.getTime() - (6 * msPerDay));
    startDate.setHours(0, 0, 0, 0);

    // Populate counts
    tickets.forEach(ticket => {
      if (!ticket.created_at) return;
      const createdDate = new Date(ticket.created_at);

      // Ignore if older than 7 calendar days or somehow in the future
      if (createdDate >= startDate && createdDate <= today) {
        // Find which day bucket it belongs to (0 to 6)
        const diffTime = createdDate.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / msPerDay);

        if (diffDays >= 0 && diffDays <= 6) {
          currentCounts[diffDays]++;
        }
      }
    });

    let pCount = -1;
    let pLabel = '';

    // Format labels and build final array
    for (let i = 0; i <= 6; i++) {
      const cd = new Date(startDate.getTime() + (i * msPerDay));
      // Format: "Mon 8"
      const axisLabel = cd.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      // Format: "Sep 8, 2025" for tooltip
      const tooltipLabel = cd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      data.push({
        name: axisLabel,
        current: currentCounts[i],
        currentDate: tooltipLabel
      });
      tCurr += currentCounts[i];

      if (currentCounts[i] > pCount) {
        pCount = currentCounts[i];
        pLabel = axisLabel;
      }
    }

    if (tCurr === 0) {
      pLabel = 'N/A';
      pCount = 0;
    }

    return { chartData: data, totalCreated: tCurr, peakDay: { count: pCount, label: pLabel } };
  }, [tickets]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const currentItem = payload.find(p => p.dataKey === 'current');
      const currentVal = currentItem?.value || 0;

      return (
        <div className="bg-[#1C1C1C]/95 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[140px]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 rounded-full bg-[#f97316]"></div>
              <span className="text-xs text-neutral-400 font-medium">{currentItem?.payload.currentDate}</span>
            </div>
            <span className="text-xs text-white font-semibold">{currentVal}</span>
          </div>
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
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
      className="p-0 flex flex-col h-full bg-[#0d0d0d] border border-white/5 overflow-hidden"
    >
      {/* Header section */}
      <div className="p-5 pb-2">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#f97316]" />
            <h2 className="text-lg font-medium text-white tracking-wide">Tickets Trend</h2>
          </div>
          <button className="text-neutral-500 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[13px] text-neutral-500 font-medium mt-1">
          See tickets created over the last 7 calendar days
        </p>

        <div className="flex items-end gap-12 mt-7 mb-2">
          <div>
            <p className="text-[13px] text-neutral-500 mb-1.5 font-medium">Total Tickets</p>
            <div className="flex flex-col mt-1">
              <p className="text-[28px] leading-none font-semibold text-white tracking-tight">{tickets.length}</p>
              <p className="text-[11px] text-neutral-500 mt-1.5">Entire created tickets</p>
            </div>
          </div>
          <div>
            <p className="text-[13px] text-neutral-500 mb-1.5 font-medium">Tickets Created</p>
            <div className="flex flex-col mt-1">
              <p className="text-[28px] leading-none font-semibold text-white tracking-tight">{totalCreated}</p>
              <p className="text-[11px] text-neutral-500 mt-1.5">Last 7 days</p>
            </div>
          </div>
          <div>
            <p className="text-[13px] text-neutral-500 mb-1.5 font-medium">Peak Volume</p>
            <div className="flex flex-col mt-1">
              <p className="text-[28px] leading-none font-semibold text-[#f97316] tracking-tight">{peakDay?.count}</p>
              <p className="text-[11px] text-neutral-500 mt-1.5">{peakDay?.label !== 'N/A' ? `${peakDay?.label} (Busiest)` : 'No tickets'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex-1 w-full relative px-2 pb-4 mt-6" style={{ minHeight: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            key={isInView ? 'visible' : 'hidden'}
            data={chartData}
            margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              vertical={true}
              horizontal={false}
              stroke="rgba(255,255,255,0.06)"
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#737373', fontSize: 11, fontWeight: 500 }}
              dy={15}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#737373', fontSize: 11, fontWeight: 500 }}
              dx={-10}
              tickFormatter={(val) => val === 0 ? '0' : val}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.5 }}
              isAnimationActive={false}
            />

            {/* Gradient Fill Area */}
            <Area
              type="monotone"
              dataKey="current"
              stroke="none"
              fillOpacity={1}
              fill="url(#colorCurrent)"
              isAnimationActive={isInView}
              animationBegin={400}
              animationDuration={1200}
              animationEasing="ease-out"
            />

            {/* Animated Draw Line */}
            <Line
              type="monotone"
              dataKey="current"
              stroke="#f97316"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#171717', stroke: '#f97316', strokeWidth: 2 }}
              isAnimationActive={isInView}
              animationBegin={400}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </MotionGlassCard>
  );
}

export default TotalTicketsChart;
