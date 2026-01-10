import { X } from "lucide-react";
import { useFilterStore } from "../stores/filterStore";
import { SPECIES_LIST } from "../data/species";
import "../styles/components/FilterModal.css";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FilterModal({ isOpen, onClose }: FilterModalProps) {
  const {
    dateRange,
    species,
    hasPhoto,
    setDateRange,
    toggleSpecies,
    setHasPhoto,
    resetFilters,
  } = useFilterStore();

  if (!isOpen) return null;

  return (
    <div className="filter-modal-overlay" onClick={onClose}>
      <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="filter-header">
          <h3 className="filter-title">Filter Catches</h3>
          <button className="filter-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="filter-body">
          {/* Date Range Section */}
          <div className="filter-section">
            <h4 className="filter-section-title">Date Range</h4>
            <div className="filter-chips">
              <button
                className={`filter-chip ${dateRange === "all" ? "active" : ""}`}
                onClick={() => setDateRange("all")}
              >
                All Time
              </button>
              <button
                className={`filter-chip ${dateRange === "7d" ? "active" : ""}`}
                onClick={() => setDateRange("7d")}
              >
                Last 7 Days
              </button>
              <button
                className={`filter-chip ${dateRange === "30d" ? "active" : ""}`}
                onClick={() => setDateRange("30d")}
              >
                Last 30 Days
              </button>
              <button
                className={`filter-chip ${dateRange === "1y" ? "active" : ""}`}
                onClick={() => setDateRange("1y")}
              >
                Last Year
              </button>
            </div>
          </div>

          {/* Has Photo Section */}
          <div className="filter-section">
            <h4 className="filter-section-title">Photo</h4>
            <div className="filter-chips">
              <button
                className={`filter-chip ${hasPhoto === "all" ? "active" : ""}`}
                onClick={() => setHasPhoto("all")}
              >
                All
              </button>
              <button
                className={`filter-chip ${hasPhoto === "yes" ? "active" : ""}`}
                onClick={() => setHasPhoto("yes")}
              >
                With Photo
              </button>
              <button
                className={`filter-chip ${hasPhoto === "no" ? "active" : ""}`}
                onClick={() => setHasPhoto("no")}
              >
                No Photo
              </button>
            </div>
          </div>

          {/* Species Section */}
          <div className="filter-section">
            <h4 className="filter-section-title">Species ({species.length})</h4>
            <div className="species-grid">
              {SPECIES_LIST.map((item) => (
                <label key={item} className="species-item">
                  <input
                    type="checkbox"
                    checked={species.includes(item)}
                    onChange={() => toggleSpecies(item)}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="filter-footer">
          <button className="btn-reset" onClick={resetFilters}>
            Reset All
          </button>
          <button className="btn-apply" onClick={onClose}>
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
}
