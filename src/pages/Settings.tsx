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
  HardDrive,
  Share,
  Globe,
  Info,
  FileText,
  Shield,
  ExternalLink,
} from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { useCatchStore } from "@/stores/catchStore";
import { downloadCatchesCSV } from "@/services/export";
import { generateTestCatches } from "@/data/testCatches";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useStorageQuota } from "@/hooks/useStorageQuota";
import { useTranslation } from "@/i18n";
import "@/styles/pages/Settings.css";

export default function Settings() {
  const { t } = useTranslation();
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    weightUnit,
    setWeightUnit,
    lengthUnit,
    setLengthUnit,
  } = useSettingsStore();

  const { catches, addCatch, deleteCatch } = useCatchStore();
  const [showClearModal, setShowClearModal] = useState(false);

  // PWA Install
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();

  // Storage quota
  const { quota } = useStorageQuota();

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
      alert(t("settings.data.loadTestDataSuccess", { count: addedCount }));
    } else {
      alert(t("settings.data.loadTestDataExists"));
    }
  };

  const handleInstall = async () => {
    await promptInstall();
  };

  // Determine what to show in the App section
  const showInstallButton = canInstall;
  const showInstalledBadge = isInstalled;
  const showIOSInstructions = isIOS;

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1 className="settings-title">{t("settings.title")}</h1>
      </header>

      <div className="settings-content">
        {/* App Section - PWA Install & Storage */}
        <section className="settings-section">
          <h2 className="settings-section-title">
            {t("settings.sections.app")}
          </h2>
          <div className="settings-card">
            {/* Install Button / Status */}
            <div className="app-row">
              <div className="app-row-label">
                <Share size={20} />
                <span>{t("settings.pwa.installApp")}</span>
              </div>
              <div className="app-row-value">
                {showInstalledBadge && (
                  <span className="installed-badge">
                    {t("settings.pwa.installed")}
                  </span>
                )}
                {showInstallButton && (
                  <button onClick={handleInstall} className="install-button">
                    Install
                  </button>
                )}
                {showIOSInstructions && (
                  <span className="ios-hint">
                    Tap <Share size={14} className="ios-share-icon" /> then "Add
                    to Home Screen"
                  </span>
                )}
                {!showInstalledBadge &&
                  !showInstallButton &&
                  !showIOSInstructions && (
                    <span className="install-unavailable">
                      {t("settings.pwa.notAvailable")}
                    </span>
                  )}
              </div>
            </div>

            {/* Storage Used */}
            <div className="app-row">
              <div className="app-row-label">
                <HardDrive size={20} />
                <span>{t("settings.pwa.storageUsed")}</span>
              </div>
              <div className="app-row-value">
                {quota ? (
                  <span className="storage-value">{quota.formatted}</span>
                ) : (
                  <span className="storage-value">--</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Language */}
        <section className="settings-section">
          <h2 className="settings-section-title">
            {t("settings.sections.language")}
          </h2>
          <div className="settings-card">
            <div className="theme-selector">
              <button
                onClick={() => setLanguage("system")}
                className={`theme-option ${language === "system" ? "active" : ""}`}
              >
                <Globe size={20} />
                <span className="theme-option-label">
                  {t("settings.language.system")}
                </span>
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`theme-option ${language === "en" ? "active" : ""}`}
              >
                <span className="theme-option-label">
                  {t("settings.language.en")}
                </span>
              </button>
              <button
                onClick={() => setLanguage("fr")}
                className={`theme-option ${language === "fr" ? "active" : ""}`}
              >
                <span className="theme-option-label">
                  {t("settings.language.fr")}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="settings-section">
          <h2 className="settings-section-title">
            {t("settings.sections.appearance")}
          </h2>
          <div className="settings-card">
            <div className="theme-selector">
              <button
                onClick={() => setTheme("light")}
                className={`theme-option ${theme === "light" ? "active" : ""}`}
              >
                <Sun size={20} />
                <span className="theme-option-label">
                  {t("settings.theme.light")}
                </span>
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`theme-option ${theme === "dark" ? "active" : ""}`}
              >
                <Moon size={20} />
                <span className="theme-option-label">
                  {t("settings.theme.dark")}
                </span>
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`theme-option ${theme === "system" ? "active" : ""}`}
              >
                <Smartphone size={20} />
                <span className="theme-option-label">
                  {t("settings.theme.system")}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Units */}
        <section className="settings-section">
          <h2 className="settings-section-title">
            {t("settings.sections.units")}
          </h2>
          <div className="settings-card">
            <div className="unit-row">
              <div className="unit-label">
                <Scale size={20} />
                <span>{t("settings.units.weight")}</span>
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
                <span>{t("settings.units.length")}</span>
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
          <h2 className="settings-section-title">
            {t("settings.sections.data")}
          </h2>
          <div className="settings-card">
            <button onClick={handleExport} className="action-button">
              <div className="action-icon action-icon--blue">
                <Download size={18} />
              </div>
              <div className="action-content">
                <p className="action-title">{t("settings.data.exportCsv")}</p>
                <p className="action-subtitle">
                  {t("settings.data.exportCsvSubtitle")}
                </p>
              </div>
            </button>

            <button onClick={handleLoadTestData} className="action-button">
              <div className="action-icon action-icon--green">
                <Database size={18} />
              </div>
              <div className="action-content">
                <p className="action-title">
                  {t("settings.data.loadTestData")}
                </p>
                <p className="action-subtitle">
                  {t("settings.data.loadTestDataSubtitle")}
                </p>
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
                  {t("settings.data.clearData")}
                </p>
                <p className="action-subtitle action-subtitle--danger">
                  {t("settings.data.clearDataSubtitle")}
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* About */}
        <section className="settings-section">
          <h2 className="settings-section-title">
            {t("settings.sections.about")}
          </h2>
          <div className="settings-card">
            {/* Version */}
            <div className="app-row">
              <div className="app-row-label">
                <Info size={20} />
                <span>{t("settings.about.version")}</span>
              </div>
              <div className="app-row-value">
                <span className="storage-value">v{__APP_VERSION__}</span>
              </div>
            </div>

            {/* Licenses */}
            <a
              href="https://github.com/anthonymq/catchpoint/blob/main/LICENSES.md"
              target="_blank"
              rel="noopener noreferrer"
              className="about-link"
            >
              <div className="app-row-label">
                <FileText size={20} />
                <span>{t("settings.about.licenses")}</span>
              </div>
              <ExternalLink size={16} className="about-link-icon" />
            </a>

            {/* Privacy Policy */}
            <a
              href="https://github.com/anthonymq/catchpoint/blob/main/PRIVACY.md"
              target="_blank"
              rel="noopener noreferrer"
              className="about-link"
            >
              <div className="app-row-label">
                <Shield size={20} />
                <span>{t("settings.about.privacy")}</span>
              </div>
              <ExternalLink size={16} className="about-link-icon" />
            </a>
          </div>
        </section>

        <div className="settings-version">Catchpoint v{__APP_VERSION__}</div>
      </div>

      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleConfirmClear}
        title={t("settings.data.clearDataTitle")}
        message={t("settings.data.clearDataMessage", { count: catches.length })}
        confirmText={t("settings.data.clearDataConfirm")}
        cancelText={t("common.cancel")}
        variant="danger"
      />
    </div>
  );
}
