import { create } from "zustand";
import {
  conversationRepository,
  messageRepository,
  type ConversationWithProfile,
} from "../db/repository";
import type { Message, Conversation } from "../db/index";

interface MessageState {
  conversations: ConversationWithProfile[];
  requests: ConversationWithProfile[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  unreadCount: number;
  activeTab: "inbox" | "requests";

  fetchConversations: (userId: string) => Promise<void>;
  fetchRequests: (userId: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (
    conversationId: string,
    senderId: string,
    content: string,
  ) => Promise<void>;
  startConversation: (
    currentUserId: string,
    otherUserId: string,
  ) => Promise<Conversation>;
  markAsRead: (conversationId: string, userId: string) => Promise<void>;
  acceptRequest: (conversationId: string, userId: string) => Promise<void>;
  blockConversation: (conversationId: string, userId: string) => Promise<void>;
  fetchUnreadCount: (userId: string) => Promise<void>;
  setActiveTab: (tab: "inbox" | "requests") => void;
  reset: () => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  requests: [],
  currentConversation: null,
  messages: [],
  loading: false,
  sending: false,
  unreadCount: 0,
  activeTab: "inbox",

  fetchConversations: async (userId: string) => {
    set({ loading: true });
    try {
      const conversations = await conversationRepository.getForUser(
        userId,
        false,
      );
      set({ conversations, loading: false });
    } catch (error) {
      console.error("[MessageStore] Failed to fetch conversations:", error);
      set({ loading: false });
    }
  },

  fetchRequests: async (userId: string) => {
    set({ loading: true });
    try {
      const requests = await conversationRepository.getForUser(userId, true);
      set({ requests, loading: false });
    } catch (error) {
      console.error("[MessageStore] Failed to fetch requests:", error);
      set({ loading: false });
    }
  },

  fetchMessages: async (conversationId: string) => {
    set({ loading: true });
    try {
      const conversation = await conversationRepository.get(conversationId);
      const messages =
        await messageRepository.getForConversation(conversationId);
      set({
        currentConversation: conversation ?? null,
        messages,
        loading: false,
      });
    } catch (error) {
      console.error("[MessageStore] Failed to fetch messages:", error);
      set({ loading: false });
    }
  },

  sendMessage: async (
    conversationId: string,
    senderId: string,
    content: string,
  ) => {
    if (!content.trim()) return;

    set({ sending: true });

    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      conversationId,
      senderId,
      content: content.slice(0, 1000),
      read: false,
      createdAt: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      await messageRepository.send(conversationId, senderId, content);
      set({ sending: false });
    } catch (error) {
      console.error("[MessageStore] Failed to send message:", error);
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== optimisticMessage.id),
        sending: false,
      }));
    }
  },

  startConversation: async (
    currentUserId: string,
    otherUserId: string,
  ): Promise<Conversation> => {
    const conversation = await conversationRepository.getOrCreate(
      currentUserId,
      otherUserId,
    );
    set({ currentConversation: conversation });
    return conversation;
  },

  markAsRead: async (conversationId: string, userId: string) => {
    try {
      await messageRepository.markAsRead(conversationId, userId);
      set((state) => ({
        messages: state.messages.map((m) =>
          m.senderId !== userId ? { ...m, read: true } : m,
        ),
        conversations: state.conversations.map((c) =>
          c.conversation.id === conversationId ? { ...c, unreadCount: 0 } : c,
        ),
      }));
      await get().fetchUnreadCount(userId);
    } catch (error) {
      console.error("[MessageStore] Failed to mark as read:", error);
    }
  },

  acceptRequest: async (conversationId: string, userId: string) => {
    try {
      await conversationRepository.acceptRequest(conversationId);
      await get().fetchConversations(userId);
      await get().fetchRequests(userId);
    } catch (error) {
      console.error("[MessageStore] Failed to accept request:", error);
    }
  },

  blockConversation: async (conversationId: string, userId: string) => {
    try {
      await conversationRepository.block(conversationId, userId);
      set((state) => ({
        conversations: state.conversations.filter(
          (c) => c.conversation.id !== conversationId,
        ),
        requests: state.requests.filter(
          (c) => c.conversation.id !== conversationId,
        ),
      }));
    } catch (error) {
      console.error("[MessageStore] Failed to block conversation:", error);
    }
  },

  fetchUnreadCount: async (userId: string) => {
    try {
      const unreadCount =
        await conversationRepository.getTotalUnreadCount(userId);
      set({ unreadCount });
    } catch (error) {
      console.error("[MessageStore] Failed to fetch unread count:", error);
    }
  },

  setActiveTab: (tab: "inbox" | "requests") => {
    set({ activeTab: tab });
  },

  reset: () => {
    set({
      conversations: [],
      requests: [],
      currentConversation: null,
      messages: [],
      loading: false,
      sending: false,
      unreadCount: 0,
      activeTab: "inbox",
    });
  },
}));
