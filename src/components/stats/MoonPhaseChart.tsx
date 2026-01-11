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
import {
  type MoonPhaseName,
  getMoonPhaseIcon,
  getMoonPhaseColor,
} from "../../utils/moonPhase";

interface MoonPhaseChartProps {
  data: { phase: MoonPhaseName; count: number }[];
}

export function MoonPhaseChart({ data }: MoonPhaseChartProps) {
  // Check if there's any data to display
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        No moon phase data available
      </div>
    );
  }

  // Transform data to include icons and colors
  const chartData = data.map((d) => ({
    ...d,
    icon: getMoonPhaseIcon(d.phase),
    color: getMoonPhaseColor(d.phase),
    label: `${getMoonPhaseIcon(d.phase)} ${d.phase}`,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} barCategoryGap="20%">
        <defs>
          {/* Gradient definitions for each moon phase */}
          {chartData.map((item) => (
            <linearGradient
              key={`gradient-${item.phase}`}
              id={`moon-gradient-${item.phase.replace(/\s/g, "-")}`}
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
          dataKey="phase"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-text-muted)" }}
          tickFormatter={(phase: MoonPhaseName) => getMoonPhaseIcon(phase)}
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
              key={`cell-${entry.phase}`}
              fill={`url(#moon-gradient-${entry.phase.replace(/\s/g, "-")})`}
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
