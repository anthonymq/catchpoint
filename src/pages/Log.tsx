import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Fish, Filter } from "lucide-react";
import { useCatchStore } from "../stores/catchStore";
import { useFilterStore } from "../stores/filterStore";
import { useFilteredCatches } from "../hooks/useFilteredCatches";
import { CatchCard } from "../components/CatchCard";
import { FilterModal } from "../components/FilterModal";
import { db } from "../db";
import { generateTestCatches } from "../data/testCatches";
import "../styles/pages/Log.css";

export default function Log() {
  const { fetchCatches, deleteCatch } = useCatchStore();
  const { activeFilterCount } = useFilterStore();
  const filteredCatches = useFilteredCatches();
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchCatches();
  }, [fetchCatches]);

  const handleLoadTestData = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm("Load 20 test catches? This will add to your existing data.")) {
      const testData = generateTestCatches();
      await db.catches.bulkAdd(testData);
      fetchCatches();
    }
  };

  // Only show empty state if there are NO catches at all (not just filtered ones)
  // But wait, if I filter and see nothing, I should see "No matches found", not "Go fish".
  // So I need access to the raw catches count too.
  const { catches: allCatches } = useCatchStore();

  if (allCatches.length === 0) {
    return (
      <div className="log-empty-state">
        <div className="log-empty-icon">
          <Fish size={64} />
        </div>
        <h2 className="log-empty-title">No catches yet!</h2>
        <p className="log-empty-text">
          Tap "FISH ON!" on the home screen to log your first catch.
        </p>

        <Link to="/" className="btn-primary">
          Go to Capture
        </Link>

        {/* Dev only */}
        <button onClick={handleLoadTestData} className="btn-link">
          [DEV] Load Test Data
        </button>
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
