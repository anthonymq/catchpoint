import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Loader2,
  User,
  MoreVertical,
  ShieldOff,
  Check,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useMessageStore } from "../stores/messageStore";
import { profileRepository } from "../db/repository";
import type { UserProfile } from "../db/index";
import { useTranslation } from "@/i18n";
import "../styles/pages/Chat.css";

export default function Chat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    currentConversation,
    messages,
    loading,
    sending,
    fetchMessages,
    sendMessage,
    markAsRead,
    acceptRequest,
    blockConversation,
  } = useMessageStore();

  const [inputValue, setInputValue] = useState("");
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (conversationId && user?.uid) {
      fetchMessages(conversationId);
    }
  }, [conversationId, user?.uid, fetchMessages]);

  useEffect(() => {
    if (currentConversation && user?.uid) {
      const otherUserId = currentConversation.participantIds.find(
        (id) => id !== user.uid,
      );
      if (otherUserId) {
        profileRepository.get(otherUserId).then((profile) => {
          setOtherUser(profile ?? null);
        });
      }
      markAsRead(currentConversation.id, user.uid);
    }
  }, [currentConversation, user?.uid, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !conversationId || !user?.uid || sending) return;

    const content = inputValue.trim();
    setInputValue("");
    await sendMessage(conversationId, user.uid, content);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAccept = async () => {
    if (!conversationId || !user?.uid) return;
    await acceptRequest(conversationId, user.uid);
    setShowMenu(false);
  };

  const handleBlock = async () => {
    if (!conversationId || !user?.uid) return;
    await blockConversation(conversationId, user.uid);
    navigate("/messages");
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isRequest = currentConversation?.isRequest;

  return (
    <div className="chat-page">
      <header className="chat-header">
        <button
          className="chat-back-btn"
          onClick={() => navigate("/messages")}
          aria-label={t("common.back")}
        >
          <ArrowLeft size={24} />
        </button>
        <button
          className="chat-user-info"
          onClick={() => otherUser && navigate(`/profile/${otherUser.userId}`)}
        >
          <div className="chat-avatar">
            {otherUser?.photoUrl ? (
              <img
                src={otherUser.photoUrl}
                alt=""
                className="chat-avatar-image"
              />
            ) : (
              <User size={20} />
            )}
          </div>
          <span className="chat-username">
            {otherUser?.displayName || t("messages.unknownUser")}
          </span>
        </button>
        <div className="chat-menu-container">
          <button
            className="chat-menu-btn"
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Menu"
          >
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className="chat-menu">
              <button className="chat-menu-item danger" onClick={handleBlock}>
                <ShieldOff size={18} />
                <span>{t("messages.block")}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {isRequest && (
        <div className="chat-request-banner">
          <p>{t("messages.requestNotice")}</p>
          <div className="chat-request-actions">
            <button className="chat-accept-btn" onClick={handleAccept}>
              <Check size={18} />
              {t("messages.accept")}
            </button>
            <button className="chat-block-btn" onClick={handleBlock}>
              <ShieldOff size={18} />
              {t("messages.block")}
            </button>
          </div>
        </div>
      )}

      <div className="chat-messages">
        {loading ? (
          <div className="chat-loading">
            <Loader2 size={32} className="spinning" />
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <p>{t("messages.startConversation")}</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isMine = message.senderId === user?.uid;
              return (
                <div
                  key={message.id}
                  className={`chat-message ${isMine ? "mine" : "theirs"}`}
                >
                  <div className="chat-message-bubble">
                    <p className="chat-message-text">{message.content}</p>
                    <span className="chat-message-time">
                      {formatMessageTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="chat-input-container">
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder={t("messages.placeholder")}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!inputValue.trim() || sending}
          aria-label={t("messages.send")}
        >
          {sending ? (
            <Loader2 size={20} className="spinning" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
    </div>
  );
}
