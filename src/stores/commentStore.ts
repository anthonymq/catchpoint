import { create } from "zustand";
import {
  commentRepository,
  notificationRepository,
  type CommentWithProfile,
} from "../db/repository";

interface CommentState {
  commentCounts: Map<string, number>;
  comments: CommentWithProfile[];
  commentsLoading: boolean;
  commentsModalCatchId: string | null;
  commentsModalCatchOwnerId: string | null;

  initializeComments: (catchIds: string[]) => Promise<void>;
  addComment: (
    catchId: string,
    userId: string,
    catchOwnerId: string,
    content: string,
  ) => Promise<void>;
  deleteComment: (commentId: string, userId: string) => Promise<boolean>;
  getCommentCount: (catchId: string) => number;
  openCommentsModal: (catchId: string, catchOwnerId: string) => Promise<void>;
  closeCommentsModal: () => void;
  reset: () => void;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  commentCounts: new Map(),
  comments: [],
  commentsLoading: false,
  commentsModalCatchId: null,
  commentsModalCatchOwnerId: null,

  initializeComments: async (catchIds: string[]) => {
    if (catchIds.length === 0) return;

    const counts = await commentRepository.getCommentCountsBatch(catchIds);

    set((state) => {
      const newCounts = new Map(state.commentCounts);
      counts.forEach((count, catchId) => {
        newCounts.set(catchId, count);
      });
      return { commentCounts: newCounts };
    });
  },

  addComment: async (
    catchId: string,
    userId: string,
    catchOwnerId: string,
    content: string,
  ) => {
    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent.length > 500) return;

    set((state) => {
      const newCounts = new Map(state.commentCounts);
      const current = newCounts.get(catchId) || 0;
      newCounts.set(catchId, current + 1);
      return { commentCounts: newCounts };
    });

    try {
      await commentRepository.add(
        catchId,
        userId,
        catchOwnerId,
        trimmedContent,
      );

      if (userId !== catchOwnerId) {
        await notificationRepository.create(
          catchOwnerId,
          "comment",
          userId,
          catchId,
        );
      }

      const { commentsModalCatchId } = get();
      if (commentsModalCatchId === catchId) {
        const comments = await commentRepository.getForCatch(catchId);
        set({ comments });
      }
    } catch (error) {
      set((state) => {
        const revertedCounts = new Map(state.commentCounts);
        const current = revertedCounts.get(catchId) || 1;
        revertedCounts.set(catchId, Math.max(0, current - 1));
        return { commentCounts: revertedCounts };
      });
      console.error("[CommentStore] Add comment failed:", error);
    }
  },

  deleteComment: async (commentId: string, userId: string) => {
    const canDelete = await commentRepository.canDelete(commentId, userId);
    if (!canDelete) return false;

    const comment = await commentRepository.get(commentId);
    if (!comment) return false;

    const catchId = comment.catchId;

    set((state) => {
      const newCounts = new Map(state.commentCounts);
      const current = newCounts.get(catchId) || 1;
      newCounts.set(catchId, Math.max(0, current - 1));

      const newComments = state.comments.filter(
        (c) => c.comment.id !== commentId,
      );

      return {
        commentCounts: newCounts,
        comments: newComments,
      };
    });

    try {
      await commentRepository.delete(commentId);
      return true;
    } catch (error) {
      set((state) => {
        const revertedCounts = new Map(state.commentCounts);
        const current = revertedCounts.get(catchId) || 0;
        revertedCounts.set(catchId, current + 1);
        return { commentCounts: revertedCounts };
      });
      console.error("[CommentStore] Delete comment failed:", error);
      return false;
    }
  },

  getCommentCount: (catchId: string) => {
    return get().commentCounts.get(catchId) || 0;
  },

  openCommentsModal: async (catchId: string, catchOwnerId: string) => {
    set({
      commentsModalCatchId: catchId,
      commentsModalCatchOwnerId: catchOwnerId,
      commentsLoading: true,
      comments: [],
    });

    try {
      const comments = await commentRepository.getForCatch(catchId);
      set({ comments, commentsLoading: false });
    } catch (error) {
      console.error("[CommentStore] Failed to fetch comments:", error);
      set({ commentsLoading: false });
    }
  },

  closeCommentsModal: () => {
    set({
      commentsModalCatchId: null,
      commentsModalCatchOwnerId: null,
      comments: [],
      commentsLoading: false,
    });
  },

  reset: () => {
    set({
      commentCounts: new Map(),
      comments: [],
      commentsLoading: false,
      commentsModalCatchId: null,
      commentsModalCatchOwnerId: null,
    });
  },
}));
