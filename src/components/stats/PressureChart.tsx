import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { PressureTrend } from "../../utils/statistics";

interface PressureChartProps {
  data: { trend: PressureTrend; count: number }[];
}

// Pressure trend metadata: icons, colors, and descriptions
const PRESSURE_TREND_META: Record<
  PressureTrend,
  { icon: string; color: string; description: string }
> = {
  Rising: {
    icon: "↗️",
    color: "#4ade80", // green - fish often feed before high pressure
    description: "High pressure (>1020 hPa)",
  },
  Stable: {
    icon: "➡️",
    color: "#60a5fa", // blue - consistent conditions
    description: "Normal pressure (1005-1020 hPa)",
  },
  Falling: {
    icon: "↘️",
    color: "#f97316", // orange - fish often feed before storms
    description: "Low pressure (<1005 hPa)",
  },
  Unknown: {
    icon: "❓",
    color: "#9ca3af", // gray - no data
    description: "No pressure data",
  },
};

function getPressureIcon(trend: PressureTrend): string {
  return PRESSURE_TREND_META[trend]?.icon || "❓";
}

function getPressureColor(trend: PressureTrend): string {
  return PRESSURE_TREND_META[trend]?.color || "#9ca3af";
}

export function PressureChart({ data }: PressureChartProps) {
  // Check if there's any data to display
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        No pressure data available
      </div>
    );
  }

  // Filter out Unknown if there are other categories with data
  const filteredData = data.filter(
    (d) =>
      d.trend !== "Unknown" || data.every((item) => item.trend === "Unknown"),
  );

  // Transform data to include icons and colors
  const chartData = filteredData.map((d) => ({
    ...d,
    icon: getPressureIcon(d.trend),
    color: getPressureColor(d.trend),
    label: `${getPressureIcon(d.trend)} ${d.trend}`,
    description: PRESSURE_TREND_META[d.trend]?.description || "",
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} barCategoryGap="20%">
        <defs>
          {/* Gradient definitions for each pressure trend */}
          {chartData.map((item) => (
            <linearGradient
              key={`gradient-${item.trend}`}
              id={`pressure-gradient-${item.trend}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={item.color} stopOpacity={0.9} />
              <stop offset="100%" stopColor={item.color} stopOpacity={0.6} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--color-border)"
          strokeOpacity={0.5}
        />
        <XAxis
          dataKey="trend"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-text-muted)" }}
          tickFormatter={(trend: PressureTrend) => getPressureIcon(trend)}
          interval={0}
        />
        <YAxis
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-text-muted)" }}
          width={30}
          allowDecimals={false}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const item = payload[0].payload as (typeof chartData)[0];
              return (
                <div className="chart-tooltip">
                  <p className="chart-tooltip-title">{item.label}</p>
                  <p className="chart-tooltip-subtitle">{item.description}</p>
                  <p
                    className="chart-tooltip-value"
                    style={{ color: item.color }}
                  >
                    {item.count} catch{item.count !== 1 ? "es" : ""}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar
          dataKey="count"
          radius={[6, 6, 0, 0]}
          animationDuration={800}
          animationEasing="ease-out"
        >
          {chartData.map((entry) => (
            <Cell
              key={`cell-${entry.trend}`}
              fill={`url(#pressure-gradient-${entry.trend})`}
              style={{
                filter: `drop-shadow(0 2px 4px ${entry.color}40)`,
              }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
