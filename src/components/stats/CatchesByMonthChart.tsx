import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatMonthLabel } from "../../utils/statistics";

interface CatchesByMonthChartProps {
  data: { month: string; count: number }[];
}

export function CatchesByMonthChart({ data }: CatchesByMonthChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        No data available
      </div>
    );
  }

  const formattedData = data.map((d) => ({
    ...d,
    label: formatMonthLabel(d.month).split(" ")[0], // Just month name for compactness
    fullLabel: formatMonthLabel(d.month),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={formattedData}>
        <defs>
          <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
            <stop offset="50%" stopColor="#2563eb" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.75} />
          </linearGradient>
          {/* Shadow for bars */}
          <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="2"
              floodColor="#3b82f6"
              floodOpacity="0.3"
            />
          </filter>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--color-border)"
          strokeOpacity={0.5}
        />
        <XAxis
          dataKey="label"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-text-muted)" }}
        />
        <YAxis
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-text-muted)" }}
          width={30}
        />
        <Tooltip
          cursor={{ fill: "var(--color-primary-light)", radius: 8 }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="chart-tooltip">
                  <p className="chart-tooltip-title">
                    {payload[0].payload.fullLabel}
                  </p>
                  <p
                    className="chart-tooltip-value"
                    style={{ color: "#3b82f6" }}
                  >
                    📅 {payload[0].value} catches
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar
          dataKey="count"
          fill="url(#colorMonthly)"
          radius={[8, 8, 0, 0]}
          animationDuration={800}
          animationEasing="ease-out"
          style={{ filter: "url(#barShadow)" }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
