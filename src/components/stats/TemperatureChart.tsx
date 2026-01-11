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
import type { TemperatureRange } from "../../utils/statistics";

interface TemperatureChartProps {
  data: {
    range: TemperatureRange;
    count: number;
    minTemp: number;
    maxTemp: number;
  }[];
}

// Temperature range metadata: icons, colors, and descriptions
const TEMPERATURE_RANGE_META: Record<
  TemperatureRange,
  { icon: string; color: string; description: string }
> = {
  Freezing: {
    icon: "🥶",
    color: "#a5b4fc", // indigo-light - very cold
    description: "Below 0°C (32°F)",
  },
  Cold: {
    icon: "❄️",
    color: "#60a5fa", // blue - cold
    description: "0-10°C (32-50°F)",
  },
  Cool: {
    icon: "🌤️",
    color: "#34d399", // emerald - cool
    description: "10-15°C (50-59°F)",
  },
  Mild: {
    icon: "☀️",
    color: "#fbbf24", // amber - mild
    description: "15-20°C (59-68°F)",
  },
  Warm: {
    icon: "🌡️",
    color: "#f97316", // orange - warm
    description: "20-25°C (68-77°F)",
  },
  Hot: {
    icon: "🔥",
    color: "#ef4444", // red - hot
    description: "Above 25°C (77°F)",
  },
  Unknown: {
    icon: "❓",
    color: "#9ca3af", // gray - no data
    description: "No temperature data",
  },
};

function getTemperatureIcon(range: TemperatureRange): string {
  return TEMPERATURE_RANGE_META[range]?.icon || "❓";
}

function getTemperatureColor(range: TemperatureRange): string {
  return TEMPERATURE_RANGE_META[range]?.color || "#9ca3af";
}

export function TemperatureChart({ data }: TemperatureChartProps) {
  // Check if there's any data to display
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="chart-empty-state">No temperature data available</div>
    );
  }

  // Filter out Unknown if there are other categories with data
  const filteredData = data.filter(
    (d) =>
      d.range !== "Unknown" || data.every((item) => item.range === "Unknown"),
  );

  // Transform data to include icons and colors
  const chartData = filteredData.map((d) => ({
    ...d,
    icon: getTemperatureIcon(d.range),
    color: getTemperatureColor(d.range),
    label: `${getTemperatureIcon(d.range)} ${d.range}`,
    description: TEMPERATURE_RANGE_META[d.range]?.description || "",
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} barCategoryGap="15%">
        <defs>
          {/* Gradient definitions for each temperature range */}
          {chartData.map((item) => (
            <linearGradient
              key={`gradient-${item.range}`}
              id={`temp-gradient-${item.range}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={item.color} stopOpacity={0.95} />
              <stop offset="100%" stopColor={item.color} stopOpacity={0.65} />
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
          dataKey="range"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-text-muted)" }}
          tickFormatter={(range: TemperatureRange) => getTemperatureIcon(range)}
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
              key={`cell-${entry.range}`}
              fill={`url(#temp-gradient-${entry.range})`}
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
