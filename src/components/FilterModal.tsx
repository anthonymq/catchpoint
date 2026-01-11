import { X, ArrowUp, ArrowDown } from "lucide-react";
import { useFilterStore, type SortBy } from "../stores/filterStore";
import { useFilteredCatches } from "../hooks/useFilteredCatches";
import { SPECIES_LIST } from "../data/species";
import { useTranslation } from "@/i18n";
import "../styles/components/FilterModal.css";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FilterModal({ isOpen, onClose }: FilterModalProps) {
  const { t } = useTranslation();
  const {
    dateRange,
    species,
    hasPhoto,
    sortBy,
    sortOrder,
    setDateRange,
    toggleSpecies,
    setHasPhoto,
    setSortBy,
    setSortOrder,
    resetFilters,
  } = useFilterStore();

  // Get live count of filtered catches
  const filteredCatches = useFilteredCatches();
  const resultCount = filteredCatches.length;

  if (!isOpen) return null;

  const handleSortByClick = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      // Toggle order if same sort field clicked
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      // Set sensible default order for each sort type
      setSortOrder(
        newSortBy === "date" ? "desc" : newSortBy === "weight" ? "desc" : "asc",
      );
    }
  };

  const getSortLabel = (sortType: SortBy): string => {
    switch (sortType) {
      case "date":
        return t("filter.sortDate");
      case "weight":
        return t("filter.sortWeight");
      case "species":
        return t("filter.sortSpecies");
    }
  };

  return (
    <div className="filter-modal-overlay" onClick={onClose}>
      <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="filter-header">
          <h3 className="filter-title">{t("filter.title")}</h3>
          <button className="filter-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="filter-body">
          {/* Sort Section */}
          <div className="filter-section">
            <h4 className="filter-section-title">{t("filter.sortBy")}</h4>
            <div className="filter-chips">
              {(["date", "weight", "species"] as SortBy[]).map((sortType) => (
                <button
                  key={sortType}
                  className={`filter-chip sort-chip ${sortBy === sortType ? "active" : ""}`}
                  onClick={() => handleSortByClick(sortType)}
                  aria-label={`${t("filter.sortBy")} ${getSortLabel(sortType)}`}
                >
                  {getSortLabel(sortType)}
                  {sortBy === sortType && (
                    <span className="sort-order-icon">
                      {sortOrder === "asc" ? (
                        <ArrowUp size={14} />
                      ) : (
                        <ArrowDown size={14} />
                      )}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Section */}
          <div className="filter-section">
            <h4 className="filter-section-title">{t("filter.dateRange")}</h4>
            <div className="filter-chips">
              <button
                className={`filter-chip ${dateRange === "all" ? "active" : ""}`}
                onClick={() => setDateRange("all")}
              >
                {t("filter.allTime")}
              </button>
              <button
                className={`filter-chip ${dateRange === "7d" ? "active" : ""}`}
                onClick={() => setDateRange("7d")}
              >
                {t("filter.last7Days")}
              </button>
              <button
                className={`filter-chip ${dateRange === "30d" ? "active" : ""}`}
                onClick={() => setDateRange("30d")}
              >
                {t("filter.last30Days")}
              </button>
              <button
                className={`filter-chip ${dateRange === "1y" ? "active" : ""}`}
                onClick={() => setDateRange("1y")}
              >
                {t("filter.thisYear")}
              </button>
            </div>
          </div>

          {/* Has Photo Section */}
          <div className="filter-section">
            <h4 className="filter-section-title">{t("catch.photo")}</h4>
            <div className="filter-chips">
              <button
                className={`filter-chip ${hasPhoto === "all" ? "active" : ""}`}
                onClick={() => setHasPhoto("all")}
              >
                {t("filter.allSpecies")}
              </button>
              <button
                className={`filter-chip ${hasPhoto === "yes" ? "active" : ""}`}
                onClick={() => setHasPhoto("yes")}
              >
                {t("common.yes")}
              </button>
              <button
                className={`filter-chip ${hasPhoto === "no" ? "active" : ""}`}
                onClick={() => setHasPhoto("no")}
              >
                {t("common.no")}
              </button>
            </div>
          </div>

          {/* Species Section */}
          <div className="filter-section">
            <h4 className="filter-section-title">
              {t("filter.species")} ({species.length})
            </h4>
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
            {t("filter.reset")}
          </button>
          <button className="btn-apply" onClick={onClose}>
            {resultCount === 1
              ? t("log.catchesSingular", { count: 1 })
              : t("log.catches", { count: resultCount })}
          </button>
        </div>
      </div>
    </div>
  );
}
