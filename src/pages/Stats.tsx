import { useEffect, useMemo, useState } from "react";
import { useCatchStore } from "../stores/catchStore";
import { calculateStatistics } from "../utils/statistics";
import { SpeciesChart } from "../components/stats/SpeciesChart";
import { CatchesByMonthChart } from "../components/stats/CatchesByMonthChart";
import { CatchesByTimeChart } from "../components/stats/CatchesByTimeChart";
import "../styles/pages/Stats.css";

// Skeleton loading components
function StatCardSkeleton() {
  return (
    <div className="stat-card stat-card--skeleton">
      <div
        className="skeleton-line skeleton-shimmer"
        style={{ width: "60%", height: "12px" }}
      />
      <div
        className="skeleton-line skeleton-shimmer"
        style={{ width: "80%", height: "24px", marginTop: "8px" }}
      />
    </div>
  );
}

function ChartCardSkeleton({ title }: { title: string }) {
  return (
    <div className="chart-card chart-card--skeleton">
      <h3 className="chart-card-title">{title}</h3>
      <div className="chart-container">
        <div className="skeleton-chart skeleton-shimmer" />
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="stats-page">
      <h1 className="stats-header">Statistics</h1>

      <div className="stats-summary-grid">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <ChartCardSkeleton title="Catches by Time" />

      <div className="charts-grid">
        <ChartCardSkeleton title="Species Distribution" />
        <ChartCardSkeleton title="Monthly Activity" />
      </div>
    </div>
  );
}

export default function Stats() {
  const { catches, fetchCatches, loading } = useCatchStore();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    fetchCatches().then(() => setHasLoaded(true));
  }, [fetchCatches]);

  const stats = useMemo(() => {
    if (catches.length > 0) {
      return calculateStatistics(catches);
    }
    return null;
  }, [catches]);

  // Show skeleton on initial load
  if (loading && !hasLoaded) {
    return <StatsSkeleton />;
  }

  if (!stats) {
    return (
      <div className="stats-empty">
        <div className="stats-empty-icon">📊</div>
        <h2 className="stats-empty-title">No statistics yet</h2>
        <p className="stats-empty-text">
          Log your first catch to see insights about your fishing habits.
        </p>
      </div>
    );
  }

  return (
    <div className="stats-page">
      <h1 className="stats-header">Statistics</h1>

      {/* Summary Cards */}
      <div className="stats-summary-grid">
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
        <div className="golden-hour-card">
          <div className="golden-hour-content">
            <span className="golden-hour-icon">🌅</span>
            <div>
              <h3 className="golden-hour-title">Golden Hour</h3>
              <p className="golden-hour-text">
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

      <div className="charts-grid">
        <ChartCard title="Species Distribution" variant="pie">
          <SpeciesChart data={stats.topSpecies} />
        </ChartCard>

        <ChartCard title="Monthly Activity">
          <CatchesByMonthChart data={stats.catchesByMonth} />
        </ChartCard>
      </div>

      {/* Weather Stats */}
      <div className="weather-stats-card">
        <h3 className="weather-stats-title">Weather Conditions</h3>
        <div className="weather-stats-grid">
          {stats.catchesBySkyCondition.map((item) => (
            <div key={item.condition} className="weather-stat-item">
              <span className="weather-stat-icon">{item.icon}</span>
              <span className="weather-stat-label">{item.condition}</span>
              <span className="weather-stat-count">{item.count}</span>
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
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">
        <span className="stat-card-icon">{icon}</span>
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
      <h3 className="chart-card-title">{title}</h3>
      <div className={containerClass}>{children}</div>
    </div>
  );
}
