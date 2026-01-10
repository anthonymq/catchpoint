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
import { clsx } from "clsx";

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

  const handleExport = () => {
    downloadCatchesCSV(catches);
  };

  const handleClearData = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete all catches? This cannot be undone.",
      )
    ) {
      // Delete one by one for now as store doesn't have clearAll
      // Ideally we should add clearAll to store/repo, but this works
      for (const c of catches) {
        await deleteCatch(c.id);
      }
    }
  };

  const handleLoadTestData = async () => {
    const testData = generateTestCatches();
    let addedCount = 0;
    for (const c of testData) {
      // Avoid duplicates if run multiple times
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
    <div className="flex flex-col h-full bg-surface">
      <header className="p-4 bg-background border-b border-border sticky top-0 z-10">
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {/* Appearance */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted mb-2 uppercase tracking-wider">
            Appearance
          </h2>
          <div className="bg-background rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="flex divide-x divide-border">
              <button
                onClick={() => setTheme("light")}
                className={clsx(
                  "flex-1 p-3 flex flex-col items-center gap-2 transition-colors",
                  theme === "light"
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-surface",
                )}
              >
                <Sun size={20} />
                <span className="text-sm">Light</span>
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={clsx(
                  "flex-1 p-3 flex flex-col items-center gap-2 transition-colors",
                  theme === "dark"
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-surface",
                )}
              >
                <Moon size={20} />
                <span className="text-sm">Dark</span>
              </button>
              <button
                onClick={() => setTheme("system")}
                className={clsx(
                  "flex-1 p-3 flex flex-col items-center gap-2 transition-colors",
                  theme === "system"
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-surface",
                )}
              >
                <Smartphone size={20} />
                <span className="text-sm">System</span>
              </button>
            </div>
          </div>
        </section>

        {/* Units */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted mb-2 uppercase tracking-wider">
            Units
          </h2>
          <div className="bg-background rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <Scale size={20} className="text-text-muted" />
                <span>Weight</span>
              </div>
              <div className="flex bg-surface rounded p-1">
                <button
                  onClick={() => setWeightUnit("lbs")}
                  className={clsx(
                    "px-3 py-1 rounded text-sm transition-colors",
                    weightUnit === "lbs"
                      ? "bg-white shadow text-primary font-medium"
                      : "text-text-muted hover:text-text",
                  )}
                >
                  lbs
                </button>
                <button
                  onClick={() => setWeightUnit("kg")}
                  className={clsx(
                    "px-3 py-1 rounded text-sm transition-colors",
                    weightUnit === "kg"
                      ? "bg-white shadow text-primary font-medium"
                      : "text-text-muted hover:text-text",
                  )}
                >
                  kg
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <Ruler size={20} className="text-text-muted" />
                <span>Length</span>
              </div>
              <div className="flex bg-surface rounded p-1">
                <button
                  onClick={() => setLengthUnit("in")}
                  className={clsx(
                    "px-3 py-1 rounded text-sm transition-colors",
                    lengthUnit === "in"
                      ? "bg-white shadow text-primary font-medium"
                      : "text-text-muted hover:text-text",
                  )}
                >
                  in
                </button>
                <button
                  onClick={() => setLengthUnit("cm")}
                  className={clsx(
                    "px-3 py-1 rounded text-sm transition-colors",
                    lengthUnit === "cm"
                      ? "bg-white shadow text-primary font-medium"
                      : "text-text-muted hover:text-text",
                  )}
                >
                  cm
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted mb-2 uppercase tracking-wider">
            Data
          </h2>
          <div className="bg-background rounded-lg shadow-sm border border-border overflow-hidden flex flex-col">
            <button
              onClick={handleExport}
              className="flex items-center gap-3 p-4 text-left hover:bg-surface transition-colors border-b border-border last:border-0"
            >
              <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                <Download size={20} />
              </div>
              <div className="flex-1">
                <div className="font-medium">Export CSV</div>
                <div className="text-xs text-text-muted">
                  Download all your catches
                </div>
              </div>
            </button>

            <button
              onClick={handleLoadTestData}
              className="flex items-center gap-3 p-4 text-left hover:bg-surface transition-colors border-b border-border last:border-0"
            >
              <div className="p-2 bg-green-100 text-green-600 rounded-full">
                <Database size={20} />
              </div>
              <div className="flex-1">
                <div className="font-medium">Load Test Data</div>
                <div className="text-xs text-text-muted">
                  Add 20 sample catches
                </div>
              </div>
            </button>

            <button
              onClick={handleClearData}
              className="flex items-center gap-3 p-4 text-left hover:bg-red-50 transition-colors border-b border-border last:border-0"
            >
              <div className="p-2 bg-red-100 text-red-600 rounded-full">
                <Trash2 size={20} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-red-600">Clear All Data</div>
                <div className="text-xs text-red-400">
                  Permanently delete everything
                </div>
              </div>
            </button>
          </div>
        </section>

        <div className="text-center text-xs text-text-muted pt-4">
          Catchpoint v0.1.0 (Alpha)
        </div>
      </div>
    </div>
  );
}
