import { useEffect, useMemo } from "react";
import { useCatchStore } from "../stores/catchStore";
import { calculateStatistics } from "../utils/statistics";
import { SpeciesChart } from "../components/stats/SpeciesChart";
import { CatchesByMonthChart } from "../components/stats/CatchesByMonthChart";
import { CatchesByTimeChart } from "../components/stats/CatchesByTimeChart";

export default function Stats() {
  const { catches, fetchCatches } = useCatchStore();

  useEffect(() => {
    fetchCatches();
  }, [fetchCatches]);

  const stats = useMemo(() => {
    if (catches.length > 0) {
      return calculateStatistics(catches);
    }
    return null;
  }, [catches]);

  if (!stats) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center text-gray-500">
        <div className="text-4xl mb-4">📊</div>
        <h2 className="text-xl font-semibold mb-2">No statistics yet</h2>
        <p>Log your first catch to see insights about your fishing habits.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50 p-4 space-y-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Catches" value={stats.totalCatches} icon="🎣" />
        <StatCard
          label="Top Species"
          value={stats.topSpecies[0]?.species || "-"}
          icon="🐟"
        />
        <StatCard
          label="Avg Weight"
          value={
            stats.averageWeight ? `${stats.averageWeight.toFixed(1)} lb` : "-"
          }
          icon="⚖️"
        />
        <StatCard
          label="Best Day"
          value={
            stats.bestDay?.date
              ? new Date(stats.bestDay.date).toLocaleDateString(undefined, {
                  weekday: "short",
                })
              : "-"
          }
          icon="📅"
        />
      </div>

      {/* Golden Hour Insight */}
      {stats.goldenHourInsight && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🌅</span>
            <div>
              <h3 className="font-semibold text-amber-900">Golden Hour</h3>
              <p className="text-sm text-amber-800 mt-1">
                {stats.goldenHourInsight.insightText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <ChartCard title="Catches by Time">
        <CatchesByTimeChart data={stats.catchesByHour} />
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Species Distribution" variant="pie">
          <SpeciesChart data={stats.topSpecies} />
        </ChartCard>

        <ChartCard title="Monthly Activity">
          <CatchesByMonthChart data={stats.catchesByMonth} />
        </ChartCard>
      </div>

      {/* Weather Stats */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Weather Conditions</h3>
        <div className="grid grid-cols-3 gap-2">
          {stats.catchesBySkyCondition.map((item) => (
            <div
              key={item.condition}
              className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg"
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs text-gray-500 font-medium">
                {item.condition}
              </span>
              <span className="font-bold text-gray-900">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-3 flex flex-col items-center justify-center text-center h-24">
      <div className="text-sm text-gray-500 font-medium mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <span className="text-lg opacity-80">{icon}</span>
        {value}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  variant = "default",
}: {
  title: string;
  children: React.ReactNode;
  variant?: "default" | "pie";
}) {
  const containerClass =
    variant === "pie"
      ? "chart-container chart-container--pie"
      : "chart-container";
  return (
    <div className="chart-card">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <div className={containerClass}>{children}</div>
    </div>
  );
}
