import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Fish, Filter } from "lucide-react";
import { useCatchStore } from "../stores/catchStore";
import { useFilterStore } from "../stores/filterStore";
import { useFilteredCatches } from "../hooks/useFilteredCatches";
import { CatchCard } from "../components/CatchCard";
import { FilterModal } from "../components/FilterModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { db } from "../db";
import { generateTestCatches } from "../data/testCatches";
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

export default function Log() {
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
            <h1 className="log-title">Catch Log</h1>
            <p className="log-subtitle">Loading...</p>
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
        <h2 className="log-empty-title">No catches yet!</h2>
        <p className="log-empty-text">
          Tap <strong>"FISH ON!"</strong> on the home screen to log your first
          catch.
        </p>

        <Link to="/" className="btn-primary log-empty-cta">
          Start Fishing
        </Link>

        {/* Dev only */}
        <button onClick={handleLoadTestDataClick} className="btn-link">
          [DEV] Load Test Data
        </button>

        <ConfirmModal
          isOpen={showTestDataModal}
          onClose={() => setShowTestDataModal(false)}
          onConfirm={handleConfirmLoadTestData}
          title="Load Test Data?"
          message="This will add 20 sample catches to your log for testing purposes."
          confirmText="Load Data"
          cancelText="Cancel"
          variant="info"
        />
      </div>
    );
  }

  const activeFilters = activeFilterCount();

  return (
    <div className="log-page">
      <div className="log-header">
        <div>
          <h1 className="log-title">Catch Log</h1>
          <p className="log-subtitle">
            {filteredCatches.length} catches
            {allCatches.length !== filteredCatches.length &&
              ` (of ${allCatches.length})`}
          </p>
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

      <div className="log-list">
        {filteredCatches.length === 0 ? (
          <div className="text-center p-8 text-muted">
            <p>No catches match your filters.</p>
            <button
              className="btn-link mt-2"
              onClick={() => useFilterStore.getState().resetFilters()}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredCatches.map((catchItem) => (
            <CatchCard
              key={catchItem.id}
              catchData={catchItem}
              onDelete={deleteCatch}
              onClick={(id) => navigate(`/catch/${id}`)}
            />
          ))
        )}
      </div>

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </div>
  );
}
