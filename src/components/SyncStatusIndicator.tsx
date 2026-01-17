import React from "react";
import { Check, RefreshCw, AlertTriangle, CloudOff } from "lucide-react";
import type { SyncStatus } from "../db";
import { useTranslation } from "@/i18n";
import "../styles/components/SyncStatusIndicator.css";

interface SyncStatusIndicatorProps {
  status: SyncStatus | undefined;
  size?: number;
  showLabel?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  status,
  size = 16,
  showLabel = false,
}) => {
  const { t } = useTranslation();

  const getStatusInfo = () => {
    switch (status) {
      case "synced":
        return {
          icon: <Check size={size} />,
          className: "sync-status--synced",
          label: t("sync.synced"),
        };
      case "syncing":
        return {
          icon: (
            <RefreshCw size={size} className="sync-status__icon--spinning" />
          ),
          className: "sync-status--syncing",
          label: t("sync.syncing"),
        };
      case "failed":
        return {
          icon: <AlertTriangle size={size} />,
          className: "sync-status--failed",
          label: t("sync.failed"),
        };
      case "pending":
      default:
        return {
          icon: <CloudOff size={size} />,
          className: "sync-status--pending",
          label: t("sync.pending"),
        };
    }
  };

  const { icon, className, label } = getStatusInfo();

  return (
    <div
      className={`sync-status ${className}`}
      title={label}
      aria-label={label}
    >
      {icon}
      {showLabel && <span className="sync-status__label">{label}</span>}
    </div>
  );
};
