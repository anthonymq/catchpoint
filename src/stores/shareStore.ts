import { create } from "zustand";
import { type Catch } from "../db";
import { catchRepository } from "../db/repository";

interface ShareState {
  isShareModalOpen: boolean;
  shareModalCatch: Catch | null;

  openShareModal: (catchData: Catch) => void;
  closeShareModal: () => void;
  makePublic: () => Promise<void>;
}

export const useShareStore = create<ShareState>((set, get) => ({
  isShareModalOpen: false,
  shareModalCatch: null,

  openShareModal: (catchData: Catch) => {
    set({
      isShareModalOpen: true,
      shareModalCatch: catchData,
    });
  },

  closeShareModal: () => {
    set({
      isShareModalOpen: false,
      shareModalCatch: null,
    });
  },

  makePublic: async () => {
    const { shareModalCatch } = get();
    if (!shareModalCatch) return;

    await catchRepository.update(shareModalCatch.id, { isPublic: true });
    set({
      shareModalCatch: { ...shareModalCatch, isPublic: true },
    });
  },
}));
