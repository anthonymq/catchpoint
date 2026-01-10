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
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="hour"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(hour) =>
            hour % 6 === 0 ? formatHourLabel(hour) : ""
          }
          interval={0}
        />
        <YAxis fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white p-2 border border-gray-200 shadow-sm rounded text-sm">
                  <p className="font-medium">{payload[0].payload.label}</p>
                  <p className="text-orange-600">{payload[0].value} catches</p>
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
          fill="#ffedd5"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
