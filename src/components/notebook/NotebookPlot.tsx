'use client';

import React, { useState } from 'react';
import { PlotData } from './types';

interface NotebookPlotProps {
  data: PlotData;
  className?: string;
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const NotebookPlot: React.FC<NotebookPlotProps> = ({ data, className = '' }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; valX: number; valY: number; label?: string } | null>(null);

  const width = data.width || 600;
  const height = data.height || 300;
  const padding = { top: 35, right: 25, bottom: 45, left: 55 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  if (data.type === 'bar') {
    const labels = data.labels || [];
    const values = data.values || [];
    const maxVal = Math.max(...values, 0);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;

    const barWidth = Math.max(10, Math.min(40, (plotWidth / (labels.length || 1)) * 0.7));
    const step = plotWidth / (labels.length || 1);

    return (
      <div className={`w-full overflow-hidden my-3 max-w-full rounded-xl ${className}`} style={{ aspectRatio: `${width} / ${height}` }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full font-sans select-none block" preserveAspectRatio="xMidYMid meet">
          {data.title && (
            <text x={padding.left} y={20} className="fill-gray-900 dark:fill-white font-bold text-[13px]">
              {data.title}
            </text>
          )}

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding.top + plotHeight - pct * plotHeight;
            const val = minVal + pct * range;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  className="stroke-gray-200 dark:stroke-gray-800"
                  strokeDasharray="3 3"
                />
                <text x={padding.left - 8} y={y + 3} textAnchor="end" className="fill-gray-400 dark:fill-gray-500 font-mono text-[10px]">
                  {val.toFixed(val >= 10 || val <= -10 ? 0 : 1)}
                </text>
              </g>
            );
          })}

          {/* Zero line */}
          {minVal < 0 && (
            <line
              x1={padding.left}
              y1={padding.top + plotHeight - ((0 - minVal) / range) * plotHeight}
              x2={width - padding.right}
              y2={padding.top + plotHeight - ((0 - minVal) / range) * plotHeight}
              stroke="currentColor"
              className="stroke-gray-400 dark:stroke-gray-600"
            />
          )}

          {/* Bars */}
          {values.map((val, i) => {
            const x = padding.left + i * step + (step - barWidth) / 2;
            const barH = (Math.abs(val) / range) * plotHeight;
            const y = val >= 0
              ? padding.top + plotHeight - ((val - minVal) / range) * plotHeight
              : padding.top + plotHeight - ((0 - minVal) / range) * plotHeight;

            const color = data.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            const isHovered = hoveredPoint?.label === labels[i];

            return (
              <g
                key={i}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredPoint({ x: x + barWidth / 2, y, valX: i, valY: val, label: labels[i] })}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(2, barH)}
                  rx={3}
                  fill={color}
                  opacity={isHovered ? 1 : 0.85}
                />
                <text
                  x={x + barWidth / 2}
                  y={height - padding.bottom + 15}
                  textAnchor="middle"
                  className="fill-gray-600 dark:fill-gray-400 font-mono text-[10px]"
                >
                  {labels[i]?.length > 8 ? `${labels[i].slice(0, 7)}…` : labels[i]}
                </text>
              </g>
            );
          })}

          {/* Tooltip */}
          {hoveredPoint && (
            <g transform={`translate(${hoveredPoint.x}, ${Math.max(30, hoveredPoint.y - 10)})`}>
              <rect
                x={-45}
                y={-22}
                width={90}
                height={20}
                rx={4}
                className="fill-gray-900 dark:fill-gray-100"
              />
              <text x={0} y={-8} textAnchor="middle" className="fill-white dark:fill-gray-900 font-mono text-[10px] font-medium">
                {hoveredPoint.label}: {hoveredPoint.valY}
              </text>
            </g>
          )}
        </svg>
      </div>
    );
  }

  if (data.type === 'scatter') {
    const points = data.points || [];
    const xVals = points.map(p => p.x);
    const yVals = points.map(p => p.y);
    const minX = Math.min(...xVals, 0);
    const maxX = Math.max(...xVals, 1);
    const minY = Math.min(...yVals, 0);
    const maxY = Math.max(...yVals, 1);

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const scaleX = (val: number) => padding.left + ((val - minX) / rangeX) * plotWidth;
    const scaleY = (val: number) => padding.top + plotHeight - ((val - minY) / rangeY) * plotHeight;

    return (
      <div className={`w-full overflow-hidden my-3 max-w-full rounded-xl ${className}`} style={{ aspectRatio: `${width} / ${height}` }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full font-sans select-none block" preserveAspectRatio="xMidYMid meet">
          {data.title && (
            <text x={padding.left} y={20} className="fill-gray-900 dark:fill-white font-bold text-[13px]">
              {data.title}
            </text>
          )}

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding.top + plotHeight - pct * plotHeight;
            const valY = minY + pct * rangeY;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  className="stroke-gray-200 dark:stroke-gray-800"
                  strokeDasharray="3 3"
                />
                <text x={padding.left - 8} y={y + 3} textAnchor="end" className="fill-gray-400 dark:fill-gray-500 font-mono text-[10px]">
                  {valY.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Points */}
          {points.map((p, i) => {
            const cx = scaleX(p.x);
            const cy = scaleY(p.y);
            const color = data.color || DEFAULT_COLORS[0];
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={p.r || 4}
                fill={color}
                className="hover:opacity-100 opacity-80 cursor-pointer transition-all hover:scale-125"
                onMouseEnter={() => setHoveredPoint({ x: cx, y: cy, valX: p.x, valY: p.y, label: p.label })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* Tooltip */}
          {hoveredPoint && (
            <g transform={`translate(${hoveredPoint.x}, ${Math.max(30, hoveredPoint.y - 12)})`}>
              <rect
                x={-50}
                y={-22}
                width={100}
                height={20}
                rx={4}
                className="fill-gray-900 dark:fill-gray-100"
              />
              <text x={0} y={-8} textAnchor="middle" className="fill-white dark:fill-gray-900 font-mono text-[10px] font-medium">
                ({hoveredPoint.valX.toFixed(1)}, {hoveredPoint.valY.toFixed(1)})
              </text>
            </g>
          )}
        </svg>
      </div>
    );
  }

  // Line or Area chart
  const series = data.series || [];
  const allY = series.flatMap(s => s.y);
  const allX = series.flatMap(s => s.x || []);

  const minY = allY.length > 0 ? Math.min(...allY) : 0;
  const maxY = allY.length > 0 ? Math.max(...allY) : 1;
  const minX = allX.length > 0 ? Math.min(...allX) : 0;
  const maxX = allX.length > 0 ? Math.max(...allX) : 1;

  const padY = (maxY - minY) * 0.1 || 1;
  const plotMinY = minY - padY;
  const plotMaxY = maxY + padY;
  const rangeY = plotMaxY - plotMinY || 1;
  const rangeX = maxX - minX || 1;

  const scaleX = (val: number) => padding.left + ((val - minX) / rangeX) * plotWidth;
  const scaleY = (val: number) => padding.top + plotHeight - ((val - plotMinY) / rangeY) * plotHeight;

  return (
    <div className={`w-full overflow-x-auto my-3 ${className}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-full font-sans select-none block">
        {data.title && (
          <text x={padding.left} y={20} className="fill-gray-900 dark:fill-white font-bold text-[13px]">
            {data.title}
          </text>
        )}

        {/* Legend */}
        {series.length > 1 && (
          <g transform={`translate(${width - padding.right - series.length * 85}, 16)`}>
            {series.map((s, i) => {
              const color = s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
              return (
                <g key={i} transform={`translate(${i * 85}, 0)`}>
                  <rect x={0} y={-8} width={12} height={12} rx={2} fill={color} />
                  <text x={16} y={2} className="fill-gray-700 dark:fill-gray-300 font-mono text-[10px]">
                    {s.name}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Grid lines & Y Ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padding.top + plotHeight - pct * plotHeight;
          const valY = plotMinY + pct * rangeY;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                className="stroke-gray-200 dark:stroke-gray-800"
                strokeDasharray="3 3"
              />
              <text x={padding.left - 8} y={y + 3} textAnchor="end" className="fill-gray-400 dark:fill-gray-500 font-mono text-[10px]">
                {valY.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* X Ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const x = padding.left + pct * plotWidth;
          const valX = minX + pct * rangeX;
          return (
            <g key={i}>
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={padding.top + plotHeight}
                stroke="currentColor"
                className="stroke-gray-100 dark:stroke-gray-900"
                strokeDasharray="2 2"
              />
              <text x={x} y={height - padding.bottom + 15} textAnchor="middle" className="fill-gray-400 dark:fill-gray-500 font-mono text-[10px]">
                {valX.toFixed(valX >= 10 || valX <= -10 ? 0 : 1)}
              </text>
            </g>
          );
        })}

        {/* Series paths */}
        {series.map((s, seriesIdx) => {
          const color = s.color || DEFAULT_COLORS[seriesIdx % DEFAULT_COLORS.length];
          const xArr = s.x || s.y.map((_, i) => i);
          const points = s.y.map((y, i) => ({
            px: scaleX(xArr[i]),
            py: scaleY(y),
            origX: xArr[i],
            origY: y,
          }));

          const dPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px} ${p.py}`).join(' ');

          // For Area chart
          const zeroY = scaleY(0);
          const areaPath = `${dPath} L ${points[points.length - 1].px} ${zeroY} L ${points[0].px} ${zeroY} Z`;

          return (
            <g key={seriesIdx}>
              {data.type === 'area' && (
                <path d={areaPath} fill={color} fillOpacity={0.2} />
              )}
              <path
                d={dPath}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.px}
                  cy={p.py}
                  r={points.length > 50 ? 2 : 3.5}
                  fill={color}
                  className="hover:r-5 transition-all cursor-pointer"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      x: p.px,
                      y: p.py,
                      valX: p.origX,
                      valY: p.origY,
                      label: s.name,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </g>
          );
        })}

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <g transform={`translate(${hoveredPoint.x}, ${Math.max(30, hoveredPoint.y - 12)})`}>
            <rect
              x={-55}
              y={-22}
              width={110}
              height={20}
              rx={4}
              className="fill-gray-900 dark:fill-gray-100"
            />
            <text x={0} y={-8} textAnchor="middle" className="fill-white dark:fill-gray-900 font-mono text-[10px] font-medium">
              {hoveredPoint.label ? `${hoveredPoint.label}: ` : ''}({hoveredPoint.valX.toFixed(1)}, {hoveredPoint.valY.toFixed(1)})
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
