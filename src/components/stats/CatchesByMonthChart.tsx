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
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.05)" }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white p-2 border border-gray-200 shadow-sm rounded text-sm">
                  <p className="font-medium">{payload[0].payload.fullLabel}</p>
                  <p className="text-blue-600">{payload[0].value} catches</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
