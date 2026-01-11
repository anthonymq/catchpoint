import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Fish, Filter } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCatchStore } from "../stores/catchStore";
import { useFilterStore } from "../stores/filterStore";
import { useFilteredCatches } from "../hooks/useFilteredCatches";
import { CatchCard } from "../components/CatchCard";
import { FilterModal } from "../components/FilterModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { db } from "../db";
import { generateTestCatches } from "../data/testCatches";
import { useTranslation } from "@/i18n";
import "../styles/pages/Log.css";

function SkeletonCard() {
  return (
    <div className="log-skeleton-card">
      <div className="log-skeleton-image skeleton-shimmer" />
      <div className="log-skeleton-content">
        <div className="log-skeleton-line title skeleton-shimmer" />
        <div className="log-skeleton-line short skeleton-shimmer" />
        <div className="log-skeleton-line medium skeleton-shimmer" />
      </div>
    </div>
  );
}

function LogSkeleton() {
  return (
    <div className="log-skeleton-list">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

// Virtual list component for performance with large catch lists
import type { Catch } from "../db";

interface VirtualCatchListProps {
  filteredCatches: Catch[];
  onDelete: (id: string) => void;
  onCardClick: (id: string) => void;
  t: (key: string) => string;
}

// Card height estimate: 80px image + 16px padding top + 16px padding bottom + 16px margin bottom = ~128px
const ESTIMATED_CARD_HEIGHT = 128;

function VirtualCatchList({
  filteredCatches,
  onDelete,
  onCardClick,
  t,
}: VirtualCatchListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredCatches.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_CARD_HEIGHT,
    overscan: 5, // Render 5 extra items above/below viewport
  });

  if (filteredCatches.length === 0) {
    return (
      <div className="log-list">
        <div className="text-center p-8 text-muted">
          <p>{t("log.noMatches")}</p>
          <button
            className="btn-link mt-2"
            onClick={() => useFilterStore.getState().resetFilters()}
          >
            {t("log.clearFilters")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="log-list log-list-virtual">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const catchItem = filteredCatches[virtualItem.index];
          return (
            <div
              key={catchItem.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <CatchCard
                catchData={catchItem}
                onDelete={onDelete}
                onClick={onCardClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Log() {
  const { t } = useTranslation();
  const {
    fetchCatches,
    deleteCatch,
    loading,
    catches: allCatches,
  } = useCatchStore();
  const { activeFilterCount } = useFilterStore();
  const filteredCatches = useFilteredCatches();
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showTestDataModal, setShowTestDataModal] = useState(false);

  useEffect(() => {
    fetchCatches().then(() => setHasLoaded(true));
  }, [fetchCatches]);

  const handleLoadTestDataClick = () => {
    setShowTestDataModal(true);
  };

  const handleConfirmLoadTestData = async () => {
    const testData = generateTestCatches();
    await db.catches.bulkAdd(testData);
    fetchCatches();
  };

  // Show skeleton loading on initial load
  if (loading && !hasLoaded) {
    return (
      <div className="log-page">
        <div className="log-header">
          <div>
            <h1 className="log-title">{t("log.title")}</h1>
            <p className="log-subtitle">{t("common.loading")}</p>
          </div>
        </div>
        <div className="log-list">
          <LogSkeleton />
        </div>
      </div>
    );
  }

  if (allCatches.length === 0) {
    return (
      <div className="log-empty-state">
        {/* Animated bubbles background */}
        <div className="log-empty-bubbles" aria-hidden="true">
          <span className="bubble" />
          <span className="bubble" />
          <span className="bubble" />
          <span className="bubble" />
          <span className="bubble" />
        </div>

        <div className="log-empty-icon">
          <Fish size={64} />
        </div>
        <h2 className="log-empty-title">{t("log.empty.title")}</h2>
        <p className="log-empty-text">{t("log.empty.description")}</p>

        <Link to="/" className="btn-primary log-empty-cta">
          {t("log.empty.cta")}
        </Link>

        {/* Dev only */}
        <button onClick={handleLoadTestDataClick} className="btn-link">
          {t("log.loadTestData")}
        </button>

        <ConfirmModal
          isOpen={showTestDataModal}
          onClose={() => setShowTestDataModal(false)}
          onConfirm={handleConfirmLoadTestData}
          title={t("log.loadTestDataTitle")}
          message={t("log.loadTestDataMessage")}
          confirmText={t("log.loadTestDataConfirm")}
          cancelText={t("common.cancel")}
          variant="info"
        />
      </div>
    );
  }

  const activeFilters = activeFilterCount();

  // Format catches count text
  const catchesText =
    allCatches.length !== filteredCatches.length
      ? t("log.catchesOf", {
          filtered: filteredCatches.length,
          total: allCatches.length,
        })
      : filteredCatches.length === 1
        ? t("log.catchesSingular", { count: 1 })
        : t("log.catches", { count: filteredCatches.length });

  return (
    <div className="log-page">
      <div className="log-header">
        <div>
          <h1 className="log-title">{t("log.title")}</h1>
          <p className="log-subtitle">{catchesText}</p>
        </div>
        <button
          className="btn-icon"
          onClick={() => setIsFilterOpen(true)}
          aria-label="Filter"
        >
          <Filter size={24} />
          {activeFilters > 0 && (
            <span className="badge-count">{activeFilters}</span>
          )}
        </button>
      </div>

      <VirtualCatchList
        filteredCatches={filteredCatches}
        onDelete={deleteCatch}
        onCardClick={(id) => navigate(`/catch/${id}`)}
        t={t}
      />

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </div>
  );
}
