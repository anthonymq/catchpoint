import { useEffect, useMemo, useState } from "react";
import { useCatchStore } from "../stores/catchStore";
import { calculateStatistics } from "../utils/statistics";
import { SpeciesChart } from "../components/stats/SpeciesChart";
import { CatchesByMonthChart } from "../components/stats/CatchesByMonthChart";
import { CatchesByTimeChart } from "../components/stats/CatchesByTimeChart";
import { MoonPhaseChart } from "../components/stats/MoonPhaseChart";
import { PressureChart } from "../components/stats/PressureChart";
import { TemperatureChart } from "../components/stats/TemperatureChart";
import { useTranslation } from "@/i18n";
import { Info, X } from "lucide-react";
import "../styles/pages/Stats.css";

// Info Modal Component
function InfoModal({
  title,
  content,
  onClose,
}: {
  title: string;
  content: string;
  onClose: () => void;
}) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div
        className="info-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-modal-title"
      >
        <div className="info-modal-header">
          <h3 id="info-modal-title" className="info-modal-title">
            {title}
          </h3>
          <button
            className="info-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <p className="info-modal-content">{content}</p>
      </div>
    </div>
  );
}

// Skeleton loading components
function StatCardSkeleton() {
  return (
    <div className="stat-card stat-card--skeleton">
      <div className="skeleton-line skeleton-shimmer stat-skeleton-label" />
      <div className="skeleton-line skeleton-shimmer stat-skeleton-value" />
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

function StatsSkeleton({ t }: { t: (key: string) => string }) {
  return (
    <div className="stats-page">
      <h1 className="stats-header">{t("stats.title")}</h1>

      <div className="stats-summary-grid">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <ChartCardSkeleton title={t("stats.charts.catchesByTime")} />

      <div className="charts-grid">
        <ChartCardSkeleton title={t("stats.charts.speciesDistribution")} />
        <ChartCardSkeleton title={t("stats.charts.monthlyActivity")} />
      </div>
    </div>
  );
}

export default function Stats() {
  const { t } = useTranslation();
  const { catches, fetchCatches, loading } = useCatchStore();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeModal, setActiveModal] = useState<{
    title: string;
    content: string;
  } | null>(null);

  const openModal = (title: string, content: string) => {
    setActiveModal({ title, content });
  };

  const closeModal = () => {
    setActiveModal(null);
  };

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
    return <StatsSkeleton t={t} />;
  }

  if (!stats) {
    return (
      <div className="stats-empty">
        <div className="stats-empty-icon">📊</div>
        <h2 className="stats-empty-title">{t("stats.empty.title")}</h2>
        <p className="stats-empty-text">{t("stats.empty.description")}</p>
      </div>
    );
  }

  return (
    <div className="stats-page">
      <h1 className="stats-header">{t("stats.title")}</h1>

      {/* Summary Cards */}
      <div className="stats-summary-grid">
        <StatCard
          label={t("stats.cards.totalCatches")}
          value={stats.totalCatches}
          icon="🎣"
          tooltip={t("stats.tooltips.totalCatches")}
          onInfoClick={() =>
            openModal(
              t("stats.cards.totalCatches"),
              t("stats.tooltips.totalCatches"),
            )
          }
        />
        <StatCard
          label={t("stats.cards.topSpecies")}
          value={stats.topSpecies[0]?.species || "-"}
          icon="🐟"
          tooltip={t("stats.tooltips.topSpecies")}
          onInfoClick={() =>
            openModal(
              t("stats.cards.topSpecies"),
              t("stats.tooltips.topSpecies"),
            )
          }
        />
        <StatCard
          label={t("stats.cards.avgWeight")}
          value={
            stats.averageWeight ? `${stats.averageWeight.toFixed(1)} lb` : "-"
          }
          icon="⚖️"
          tooltip={t("stats.tooltips.avgWeight")}
          onInfoClick={() =>
            openModal(t("stats.cards.avgWeight"), t("stats.tooltips.avgWeight"))
          }
        />
        <StatCard
          label={t("stats.cards.bestDay")}
          value={
            stats.bestDay?.date
              ? new Date(stats.bestDay.date).toLocaleDateString(undefined, {
                  weekday: "short",
                })
              : "-"
          }
          icon="📅"
          tooltip={t("stats.tooltips.bestDay")}
          onInfoClick={() =>
            openModal(t("stats.cards.bestDay"), t("stats.tooltips.bestDay"))
          }
        />
      </div>

      {/* Golden Hour Insight */}
      {stats.goldenHourInsight && (
        <div className="golden-hour-card">
          <div className="golden-hour-content">
            <span className="golden-hour-icon">🌅</span>
            <div>
              <div className="golden-hour-title-wrapper">
                <h3 className="golden-hour-title">
                  {t("stats.goldenHour.title")}
                </h3>
                <button
                  className="info-button"
                  onClick={() =>
                    openModal(
                      t("stats.goldenHour.title"),
                      t("stats.tooltips.goldenHour"),
                    )
                  }
                  aria-label={`Info about ${t("stats.goldenHour.title")}`}
                >
                  <Info size={12} />
                </button>
              </div>
              <p className="golden-hour-text">
                {stats.goldenHourInsight.insightText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <ChartCard
        title={t("stats.charts.catchesByTime")}
        tooltip={t("stats.tooltips.catchesByTime")}
        onInfoClick={() =>
          openModal(
            t("stats.charts.catchesByTime"),
            t("stats.tooltips.catchesByTime"),
          )
        }
      >
        <CatchesByTimeChart data={stats.catchesByHour} />
      </ChartCard>

      <div className="charts-grid">
        <ChartCard
          title={t("stats.charts.speciesDistribution")}
          variant="pie"
          tooltip={t("stats.tooltips.speciesDistribution")}
          onInfoClick={() =>
            openModal(
              t("stats.charts.speciesDistribution"),
              t("stats.tooltips.speciesDistribution"),
            )
          }
        >
          <SpeciesChart data={stats.topSpecies} />
        </ChartCard>

        <ChartCard
          title={t("stats.charts.monthlyActivity")}
          tooltip={t("stats.tooltips.monthlyActivity")}
          onInfoClick={() =>
            openModal(
              t("stats.charts.monthlyActivity"),
              t("stats.tooltips.monthlyActivity"),
            )
          }
        >
          <CatchesByMonthChart data={stats.catchesByMonth} />
        </ChartCard>
      </div>

      {/* Moon Phase Impact Chart */}
      <ChartCard
        title={t("stats.charts.moonPhase")}
        tooltip={t("stats.tooltips.moonPhase")}
        onInfoClick={() =>
          openModal(t("stats.charts.moonPhase"), t("stats.tooltips.moonPhase"))
        }
      >
        <MoonPhaseChart data={stats.catchesByMoonPhase} />
      </ChartCard>

      {/* Barometric Pressure Impact Chart */}
      <ChartCard
        title={t("stats.charts.pressure")}
        tooltip={t("stats.tooltips.pressure")}
        onInfoClick={() =>
          openModal(t("stats.charts.pressure"), t("stats.tooltips.pressure"))
        }
      >
        <PressureChart data={stats.catchesByPressureTrend} />
      </ChartCard>

      {/* Temperature Impact Chart */}
      <ChartCard
        title={t("stats.charts.temperature")}
        tooltip={t("stats.tooltips.temperature")}
        onInfoClick={() =>
          openModal(
            t("stats.charts.temperature"),
            t("stats.tooltips.temperature"),
          )
        }
      >
        <TemperatureChart data={stats.catchesByTemperature} />
      </ChartCard>

      {/* Weather Stats */}
      <div className="weather-stats-card">
        <div className="weather-stats-header">
          <h3 className="weather-stats-title">
            {t("stats.charts.weatherConditions")}
          </h3>
          <button
            className="info-button"
            onClick={() =>
              openModal(
                t("stats.charts.weatherConditions"),
                t("stats.tooltips.weatherConditions"),
              )
            }
            aria-label={`Info about ${t("stats.charts.weatherConditions")}`}
          >
            <Info size={12} />
          </button>
        </div>
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

      {/* Info Modal */}
      {activeModal && (
        <InfoModal
          title={activeModal.title}
          content={activeModal.content}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  onInfoClick,
}: {
  label: string;
  value: string | number;
  icon: string;
  tooltip?: string;
  onInfoClick?: () => void;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-label-wrapper">
        <span className="stat-card-label">{label}</span>
        {onInfoClick && (
          <button
            className="info-button"
            onClick={onInfoClick}
            aria-label={`Info about ${label}`}
          >
            <Info size={12} />
          </button>
        )}
      </div>
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
  onInfoClick,
}: {
  title: string;
  children: React.ReactNode;
  variant?: "default" | "pie";
  tooltip?: string;
  onInfoClick?: () => void;
}) {
  const containerClass =
    variant === "pie"
      ? "chart-container chart-container--pie"
      : "chart-container";
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-card-title">{title}</h3>
        {onInfoClick && (
          <button
            className="info-button"
            onClick={onInfoClick}
            aria-label={`Info about ${title}`}
          >
            <Info size={12} />
          </button>
        )}
      </div>
      <div className={containerClass}>{children}</div>
    </div>
  );
}
