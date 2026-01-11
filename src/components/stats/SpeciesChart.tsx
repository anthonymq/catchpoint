import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface SpeciesChartProps {
  data: { species: string; count: number }[];
}

// Premium color palette with better contrast
const COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#ec4899", // Pink
];

export function SpeciesChart({ data }: SpeciesChartProps) {
  const totalCatches = useMemo(
    () => data.reduce((sum, d) => sum + d.count, 0),
    [data],
  );

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <defs>
          {COLORS.map((color, index) => (
            <linearGradient
              key={`gradient-${index}`}
              id={`pieGradient-${index}`}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.7} />
            </linearGradient>
          ))}
          {/* Drop shadow filter for segments */}
          <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>
        <Pie
          data={data}
          cx="50%"
          cy="42%"
          labelLine={false}
          outerRadius={75}
          innerRadius={35}
          fill="#8884d8"
          dataKey="count"
          nameKey="species"
          paddingAngle={3}
          animationDuration={800}
          animationEasing="ease-out"
          style={{ filter: "url(#pieShadow)" }}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={`url(#pieGradient-${index % COLORS.length})`}
              stroke="var(--color-background)"
              strokeWidth={2}
            />
          ))}
        </Pie>
        {/* Center label showing total */}
        <text
          x="50%"
          y="40%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fill: "var(--color-text)",
            fontWeight: 700,
            fontSize: "1.5rem",
          }}
        >
          {totalCatches}
        </text>
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fill: "var(--color-text-muted)",
            fontSize: "0.65rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          total
        </text>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const colorIndex = data.findIndex(
                (d) => d.species === payload[0].name,
              );
              return (
                <div className="chart-tooltip">
                  <p className="chart-tooltip-title">{payload[0].name}</p>
                  <p
                    className="chart-tooltip-value"
                    style={{
                      color: COLORS[colorIndex % COLORS.length] || "#3b82f6",
                    }}
                  >
                    🐟 {payload[0].value} catches
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend
          iconType="circle"
          iconSize={10}
          wrapperStyle={{ fontSize: "0.75rem", fontWeight: 500 }}
          formatter={(value) => (
            <span style={{ color: "var(--color-text)" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
