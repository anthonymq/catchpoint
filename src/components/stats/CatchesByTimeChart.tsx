import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatHourLabel } from "../../utils/statistics";

interface CatchesByTimeChartProps {
  data: { hour: number; count: number }[];
}

// Custom animated dot for data points
function AnimatedDot(props: {
  cx?: number;
  cy?: number;
  payload?: { count: number };
}) {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload || payload.count === 0) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#f97316"
      stroke="var(--color-background)"
      strokeWidth={2}
      style={{
        filter: "drop-shadow(0 2px 4px rgba(249, 115, 22, 0.4))",
      }}
    />
  );
}

export function CatchesByTimeChart({ data }: CatchesByTimeChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        No data available
      </div>
    );
  }

  const formattedData = data.map((d) => ({
    ...d,
    label: formatHourLabel(d.hour),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={formattedData}>
        <defs>
          <linearGradient id="colorCatches" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
            <stop offset="50%" stopColor="#f97316" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
          </linearGradient>
          {/* Glow filter for line */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--color-border)"
          strokeOpacity={0.5}
        />
        <XAxis
          dataKey="hour"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(hour) =>
            hour % 6 === 0 ? formatHourLabel(hour) : ""
          }
          interval={0}
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
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="chart-tooltip">
                  <p className="chart-tooltip-title">
                    {payload[0].payload.label}
                  </p>
                  <p
                    className="chart-tooltip-value"
                    style={{ color: "#f97316" }}
                  >
                    🎣 {payload[0].value} catches
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#f97316"
          fill="url(#colorCatches)"
          strokeWidth={2.5}
          dot={<AnimatedDot />}
          activeDot={{
            r: 6,
            fill: "#f97316",
            stroke: "var(--color-background)",
            strokeWidth: 3,
            style: { filter: "drop-shadow(0 2px 6px rgba(249, 115, 22, 0.5))" },
          }}
          animationDuration={1000}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
