import { ShareModal } from "./ShareModal";
import { useShareStore } from "../stores/shareStore";

export function ShareModalContainer() {
  const { isShareModalOpen, shareModalCatch, closeShareModal, makePublic } =
    useShareStore();

  if (!shareModalCatch) return null;

  return (
    <ShareModal
      isOpen={isShareModalOpen}
      onClose={closeShareModal}
      catchId={shareModalCatch.id}
      species={shareModalCatch.species || ""}
      isPublic={shareModalCatch.isPublic ?? false}
      onMakePublic={makePublic}
    />
  );
}
