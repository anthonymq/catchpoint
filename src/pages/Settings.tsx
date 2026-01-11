import { useState } from "react";
import {
  Moon,
  Sun,
  Smartphone,
  Download,
  Trash2,
  Database,
  Ruler,
  Scale,
} from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { useCatchStore } from "@/stores/catchStore";
import { downloadCatchesCSV } from "@/services/export";
import { generateTestCatches } from "@/data/testCatches";
import { ConfirmModal } from "@/components/ConfirmModal";
import "@/styles/pages/Settings.css";

export default function Settings() {
  const {
    theme,
    setTheme,
    weightUnit,
    setWeightUnit,
    lengthUnit,
    setLengthUnit,
  } = useSettingsStore();

  const { catches, addCatch, deleteCatch } = useCatchStore();
  const [showClearModal, setShowClearModal] = useState(false);

  const handleExport = () => {
    downloadCatchesCSV(catches);
  };

  const handleClearDataClick = () => {
    setShowClearModal(true);
  };

  const handleConfirmClear = async () => {
    for (const c of catches) {
      await deleteCatch(c.id);
    }
  };

  const handleLoadTestData = async () => {
    const testData = generateTestCatches();
    let addedCount = 0;
    for (const c of testData) {
      if (!catches.some((existing) => existing.id === c.id)) {
        await addCatch(c);
        addedCount++;
      }
    }
    if (addedCount > 0) {
      alert(`Loaded ${addedCount} test catches.`);
    } else {
      alert("Test data already loaded.");
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1 className="settings-title">Settings</h1>
      </header>

      <div className="settings-content">
        {/* Appearance */}
        <section className="settings-section">
          <h2 className="settings-section-title">Appearance</h2>
          <div className="settings-card">
            <div className="theme-selector">
              <button
                onClick={() => setTheme("light")}
                className={`theme-option ${theme === "light" ? "active" : ""}`}
              >
                <Sun size={20} />
                <span className="theme-option-label">Light</span>
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`theme-option ${theme === "dark" ? "active" : ""}`}
              >
                <Moon size={20} />
                <span className="theme-option-label">Dark</span>
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`theme-option ${theme === "system" ? "active" : ""}`}
              >
                <Smartphone size={20} />
                <span className="theme-option-label">System</span>
              </button>
            </div>
          </div>
        </section>

        {/* Units */}
        <section className="settings-section">
          <h2 className="settings-section-title">Units</h2>
          <div className="settings-card">
            <div className="unit-row">
              <div className="unit-label">
                <Scale size={20} />
                <span>Weight</span>
              </div>
              <div className="unit-toggle">
                <button
                  onClick={() => setWeightUnit("lbs")}
                  className={`unit-option ${weightUnit === "lbs" ? "active" : ""}`}
                >
                  lbs
                </button>
                <button
                  onClick={() => setWeightUnit("kg")}
                  className={`unit-option ${weightUnit === "kg" ? "active" : ""}`}
                >
                  kg
                </button>
              </div>
            </div>

            <div className="unit-row">
              <div className="unit-label">
                <Ruler size={20} />
                <span>Length</span>
              </div>
              <div className="unit-toggle">
                <button
                  onClick={() => setLengthUnit("in")}
                  className={`unit-option ${lengthUnit === "in" ? "active" : ""}`}
                >
                  in
                </button>
                <button
                  onClick={() => setLengthUnit("cm")}
                  className={`unit-option ${lengthUnit === "cm" ? "active" : ""}`}
                >
                  cm
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="settings-section">
          <h2 className="settings-section-title">Data</h2>
          <div className="settings-card">
            <button onClick={handleExport} className="action-button">
              <div className="action-icon action-icon--blue">
                <Download size={18} />
              </div>
              <div className="action-content">
                <p className="action-title">Export CSV</p>
                <p className="action-subtitle">Download all your catches</p>
              </div>
            </button>

            <button onClick={handleLoadTestData} className="action-button">
              <div className="action-icon action-icon--green">
                <Database size={18} />
              </div>
              <div className="action-content">
                <p className="action-title">Load Test Data</p>
                <p className="action-subtitle">Add 20 sample catches</p>
              </div>
            </button>

            <button
              onClick={handleClearDataClick}
              className="action-button action-button--danger"
            >
              <div className="action-icon action-icon--red">
                <Trash2 size={18} />
              </div>
              <div className="action-content">
                <p className="action-title action-title--danger">
                  Clear All Data
                </p>
                <p className="action-subtitle action-subtitle--danger">
                  Permanently delete everything
                </p>
              </div>
            </button>
          </div>
        </section>

        <div className="settings-version">Catchpoint v0.1.0 (Alpha)</div>
      </div>

      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleConfirmClear}
        title="Clear All Data?"
        message={`Are you sure you want to delete all ${catches.length} catches? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
