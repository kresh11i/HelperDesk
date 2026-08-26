import React, { useState } from 'react';
import GlassCard from '../ui/GlassCard';

function TicketStatusChart({ tickets }) {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // Group tickets into Open vs Resolved
  // Open: Open, Reopened, Assigned, In Progress
  // Resolved: Resolved, Closed
  const totalCount = tickets?.length || 0;
  
  const resolvedCount = tickets.filter(t => {
    const status = t.status?.toLowerCase();
    return status === 'closed' || status === 'resolved';
  }).length;
  
  const openCount = totalCount - resolvedCount;

  const resolvedPercent = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;
  const openPercent = totalCount > 0 ? Math.round((openCount / totalCount) * 100) : 0;

  // Donut metrics (r = 50, circumference = 314.16)
  const r = 50;
  const circ = 2 * Math.PI * r; // ~314.159

  // Stroke widths
  const strokeWidth = 14;
  const hoverStrokeWidth = 18;

  // Calculate dashes
  const resolvedDash = (resolvedCount / (totalCount || 1)) * circ;
  const openDash = (openCount / (totalCount || 1)) * circ;

  return (
    <GlassCard level={1} className="p-6 flex flex-col justify-between h-full relative group">
      <div>
        <h3 className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-1">Open vs Resolved</h3>
        <p className="text-neutral-400 text-[10px] mb-4">Support ticket distribution</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
        {/* SVG Donut */}
        <div className="relative w-36 h-36 flex items-center justify-center select-none">
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 120 120"
            className="transform -rotate-90 overflow-visible"
          >
            {/* Background Circle */}
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.03)"
              strokeWidth={strokeWidth}
            />

            {totalCount === 0 ? (
              // Empty State Circle
              <circle
                cx="60"
                cy="60"
                r={r}
                fill="transparent"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={strokeWidth}
              />
            ) : (
              <>
                {/* Resolved Segment */}
                {resolvedCount > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={r}
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth={hoveredSegment === 'resolved' ? hoverStrokeWidth : strokeWidth}
                    strokeDasharray={`${resolvedDash} ${circ}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredSegment('resolved')}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />
                )}

                {/* Open Segment */}
                {openCount > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={r}
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth={hoveredSegment === 'open' ? hoverStrokeWidth : strokeWidth}
                    strokeDasharray={`${openDash} ${circ}`}
                    strokeDashoffset={-resolvedDash}
                    strokeLinecap="round"
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredSegment('open')}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />
                )}
              </>
            )}
          </svg>

          {/* Center Info Text (absolute position center) */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            {totalCount === 0 ? (
              <>
                <span className="text-xl font-light text-neutral-500">0%</span>
                <span className="text-[8px] text-neutral-600 uppercase font-semibold">Empty</span>
              </>
            ) : hoveredSegment === 'open' ? (
              <>
                <span className="text-2xl font-light text-blue-400">{openPercent}%</span>
                <span className="text-[8px] text-neutral-500 uppercase font-semibold">Open</span>
              </>
            ) : hoveredSegment === 'resolved' ? (
              <>
                <span className="text-2xl font-light text-emerald-400">{resolvedPercent}%</span>
                <span className="text-[8px] text-neutral-500 uppercase font-semibold">Resolved</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-light text-white">{resolvedPercent}%</span>
                <span className="text-[8px] text-neutral-500 uppercase font-semibold">Resolved</span>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 shrink-0 min-w-[100px]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-blue-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-white">Open Tickets</span>
              <span className="text-[10px] text-neutral-500">{openCount} ({openPercent}%)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-emerald-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-white">Resolved</span>
              <span className="text-[10px] text-neutral-500">{resolvedCount} ({resolvedPercent}%)</span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export default TicketStatusChart;
