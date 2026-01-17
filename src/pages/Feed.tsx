import React, { useEffect, useRef, useState } from "react";
import { RefreshCw, Users, Fish } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useFeedStore } from "../stores/feedStore";
import { FeedCatchCard } from "../components/FeedCatchCard";
import { useTranslation } from "@/i18n";
import "../styles/pages/Feed.css";

const PULL_THRESHOLD = 80;

export default function Feed() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    items,
    loading,
    refreshing,
    hasMore,
    error,
    fetchFeed,
    refreshFeed,
    loadMore,
  } = useFeedStore();

  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  useEffect(() => {
    if (user?.uid) {
      fetchFeed(user.uid);
    }
  }, [user?.uid, fetchFeed]);

  useEffect(() => {
    if (!user?.uid || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMore(user.uid);
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [user?.uid, hasMore, loading, loadMore]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (refreshing || containerRef.current?.scrollTop !== 0) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;

    if (diff > 0) {
      setIsPulling(true);
      setPullDistance(Math.min(diff * 0.5, PULL_THRESHOLD * 1.5));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance >= PULL_THRESHOLD && user?.uid && !refreshing) {
      refreshFeed(user.uid);
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  const handleRefreshClick = () => {
    if (user?.uid && !refreshing) {
      refreshFeed(user.uid);
    }
  };

  const showEmptyState = !loading && items.length === 0;
  const showPullIndicator = isPulling || refreshing;

  return (
    <div className="feed-page">
      <header className="feed-header">
        <h1>{t("feed.title")}</h1>
        <button
          className="feed-refresh-btn"
          onClick={handleRefreshClick}
          disabled={refreshing}
          aria-label={t("feed.refresh")}
        >
          <RefreshCw size={20} className={refreshing ? "spinning" : ""} />
        </button>
      </header>

      {showPullIndicator && (
        <div
          className="pull-indicator"
          style={{
            height: refreshing ? 50 : pullDistance,
            opacity: refreshing
              ? 1
              : Math.min(pullDistance / PULL_THRESHOLD, 1),
          }}
        >
          <RefreshCw
            size={24}
            className={refreshing ? "spinning" : ""}
            style={{
              transform: `rotate(${(pullDistance / PULL_THRESHOLD) * 180}deg)`,
            }}
          />
        </div>
      )}

      <div
        ref={containerRef}
        className="feed-content"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {error && (
          <div className="feed-error">
            <p>{error}</p>
            <button onClick={handleRefreshClick}>
              {t("common.retry") || "Retry"}
            </button>
          </div>
        )}

        {showEmptyState ? (
          <div className="feed-empty">
            <div className="feed-empty-icon">
              <Users size={48} />
            </div>
            <h2>{t("feed.empty.title")}</h2>
            <p>{t("feed.empty.description")}</p>
          </div>
        ) : (
          <>
            <div className="feed-list">
              {items.map((item) => (
                <FeedCatchCard key={item.catch.id} item={item} />
              ))}
            </div>

            {hasMore && (
              <div ref={loadMoreTriggerRef} className="feed-load-more">
                {loading && (
                  <div className="feed-loading">
                    <Fish size={24} className="bouncing" />
                    <span>{t("common.loading")}</span>
                  </div>
                )}
              </div>
            )}

            {!hasMore && items.length > 0 && (
              <div className="feed-end">
                <p>{t("feed.endOfFeed")}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
