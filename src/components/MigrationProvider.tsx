import type { ReactNode } from "react";
import { useMigration } from "@/hooks/useMigration";
import { MigrationModal } from "./MigrationModal";

interface MigrationProviderProps {
  children: ReactNode;
}

export function MigrationProvider({ children }: MigrationProviderProps) {
  const {
    showMigrationModal,
    unmigratedCount,
    progress,
    startMigration,
    skipMigration,
    closeMigrationModal,
  } = useMigration();

  return (
    <>
      {children}
      <MigrationModal
        isOpen={showMigrationModal}
        catchCount={unmigratedCount}
        progress={progress}
        onConfirm={startMigration}
        onSkip={skipMigration}
        onClose={closeMigrationModal}
      />
    </>
  );
}
