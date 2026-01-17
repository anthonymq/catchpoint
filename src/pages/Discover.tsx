import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  Fish,
  X,
  User,
  UserPlus,
  Compass,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useDiscoverStore } from "../stores/discoverStore";
import { useFollowStore } from "../stores/followStore";
import { FeedCatchCard } from "../components/FeedCatchCard";
import { useTranslation } from "@/i18n";
import type { UserProfile } from "@/db/index";
import "../styles/pages/Discover.css";

const PULL_THRESHOLD = 80;

export default function Discover() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    publicCatches,
    searchResults,
    suggestedUsers,
    trendingSpecies,
    searchQuery,
    loading,
    refreshing,
    searchLoading,
    hasMore,
    error,
    fetchPublicCatches,
    refreshPublicCatches,
    loadMoreCatches,
    searchUsers,
    fetchSuggestedUsers,
    fetchTrendingSpecies,
    setSearchQuery,
  } = useDiscoverStore();
  const { follow } = useFollowStore();

  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [activeTab, setActiveTab] = useState<"catches" | "users">("catches");
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchPublicCatches();
    fetchTrendingSpecies();
    if (user?.uid) {
      fetchSuggestedUsers(user.uid);
    }
  }, [
    fetchPublicCatches,
    fetchTrendingSpecies,
    fetchSuggestedUsers,
    user?.uid,
  ]);

  useEffect(() => {
    if (!hasMore || activeTab !== "catches") return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMoreCatches();
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
  }, [hasMore, loading, loadMoreCatches, activeTab]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      if (value.trim()) {
        searchDebounceRef.current = setTimeout(() => {
          searchUsers(value);
        }, 300);
      }
    },
    [setSearchQuery, searchUsers],
  );

  const handleClearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

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
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      refreshPublicCatches();
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  const handleRefreshClick = () => {
    if (!refreshing) {
      refreshPublicCatches();
      fetchTrendingSpecies();
      if (user?.uid) {
        fetchSuggestedUsers(user.uid);
      }
    }
  };

  const handleFollowUser = async (userId: string) => {
    if (!user?.uid) return;
    await follow(user.uid, userId);
    if (user.uid) {
      fetchSuggestedUsers(user.uid);
    }
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const showPullIndicator = isPulling || refreshing;
  const showEmptyState = !loading && publicCatches.length === 0;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="discover-page">
      <header className="discover-header">
        <h1>{t("discover.title")}</h1>
        <button
          className="discover-refresh-btn"
          onClick={handleRefreshClick}
          disabled={refreshing}
          aria-label={t("discover.refresh")}
        >
          <RefreshCw size={20} className={refreshing ? "spinning" : ""} />
        </button>
      </header>

      <div className="discover-search">
        <div className="discover-search-input-wrapper">
          <Search size={18} className="discover-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t("discover.searchPlaceholder")}
            value={searchQuery}
            onChange={handleSearchChange}
            className="discover-search-input"
          />
          {searchQuery && (
            <button
              className="discover-search-clear"
              onClick={handleClearSearch}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {isSearching ? (
        <div className="discover-search-results">
          {searchLoading ? (
            <div className="discover-loading">
              <Fish size={24} className="bouncing" />
              <span>{t("common.loading")}</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="discover-users-list">
              {searchResults.map((profile) => (
                <UserCard
                  key={profile.userId}
                  profile={profile}
                  onProfileClick={() => handleProfileClick(profile.userId)}
                  onFollow={() => handleFollowUser(profile.userId)}
                  showFollowButton={user?.uid !== profile.userId}
                  t={t}
                />
              ))}
            </div>
          ) : (
            <div className="discover-no-results">
              <Users size={48} />
              <p>{t("discover.noUsersFound")}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="discover-tabs">
            <button
              className={`discover-tab ${activeTab === "catches" ? "active" : ""}`}
              onClick={() => setActiveTab("catches")}
            >
              <Compass size={18} />
              <span>{t("discover.tabs.catches")}</span>
            </button>
            <button
              className={`discover-tab ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <Users size={18} />
              <span>{t("discover.tabs.users")}</span>
            </button>
          </div>

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
            className="discover-content"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {error && (
              <div className="discover-error">
                <p>{error}</p>
                <button onClick={handleRefreshClick}>
                  {t("common.retry") || "Retry"}
                </button>
              </div>
            )}

            {activeTab === "catches" ? (
              <>
                {trendingSpecies.length > 0 && (
                  <section className="discover-section">
                    <h2 className="discover-section-title">
                      <TrendingUp size={18} />
                      {t("discover.trendingSpecies")}
                    </h2>
                    <div className="discover-trending-list">
                      {trendingSpecies.map((item, index) => (
                        <div
                          key={item.species}
                          className="discover-trending-item"
                        >
                          <span className="trending-rank">#{index + 1}</span>
                          <span className="trending-species">
                            {item.species}
                          </span>
                          <span className="trending-count">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {showEmptyState ? (
                  <div className="discover-empty">
                    <div className="discover-empty-icon">
                      <Compass size={48} />
                    </div>
                    <h2>{t("discover.empty.title")}</h2>
                    <p>{t("discover.empty.description")}</p>
                  </div>
                ) : (
                  <>
                    <section className="discover-section">
                      <h2 className="discover-section-title">
                        <Fish size={18} />
                        {t("discover.recentCatches")}
                      </h2>
                      <div className="discover-catches-list">
                        {publicCatches.map((item) => (
                          <FeedCatchCard key={item.catch.id} item={item} />
                        ))}
                      </div>
                    </section>

                    {hasMore && (
                      <div
                        ref={loadMoreTriggerRef}
                        className="discover-load-more"
                      >
                        {loading && (
                          <div className="discover-loading">
                            <Fish size={24} className="bouncing" />
                            <span>{t("common.loading")}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {!hasMore && publicCatches.length > 0 && (
                      <div className="discover-end">
                        <p>{t("discover.endOfFeed")}</p>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="discover-users-tab">
                {suggestedUsers.length > 0 && (
                  <section className="discover-section">
                    <h2 className="discover-section-title">
                      <UserPlus size={18} />
                      {t("discover.suggestedUsers")}
                    </h2>
                    <div className="discover-suggested-list">
                      {suggestedUsers.map((suggestion) => (
                        <SuggestedUserCard
                          key={suggestion.profile.userId}
                          suggestion={suggestion}
                          onProfileClick={() =>
                            handleProfileClick(suggestion.profile.userId)
                          }
                          onFollow={() =>
                            handleFollowUser(suggestion.profile.userId)
                          }
                          t={t}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {suggestedUsers.length === 0 && (
                  <div className="discover-empty">
                    <div className="discover-empty-icon">
                      <Users size={48} />
                    </div>
                    <h2>{t("discover.noSuggestions.title")}</h2>
                    <p>{t("discover.noSuggestions.description")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface UserCardProps {
  profile: UserProfile;
  onProfileClick: () => void;
  onFollow: () => void;
  showFollowButton: boolean;
  t: (key: string) => string;
}

function UserCard({
  profile,
  onProfileClick,
  onFollow,
  showFollowButton,
  t,
}: UserCardProps) {
  return (
    <div className="user-card" onClick={onProfileClick}>
      <div className="user-card-avatar">
        {profile.photoUrl ? (
          <img src={profile.photoUrl} alt={profile.displayName} />
        ) : (
          <User size={24} />
        )}
      </div>
      <div className="user-card-info">
        <span className="user-card-name">{profile.displayName}</span>
      </div>
      {showFollowButton && (
        <button
          className="user-card-follow"
          onClick={(e) => {
            e.stopPropagation();
            onFollow();
          }}
        >
          <UserPlus size={16} />
          <span>{t("profile.follow")}</span>
        </button>
      )}
    </div>
  );
}

interface SuggestedUserCardProps {
  suggestion: {
    profile: UserProfile;
    catchCount: number;
    commonSpecies: string[];
  };
  onProfileClick: () => void;
  onFollow: () => void;
  t: (key: string) => string;
}

function SuggestedUserCard({
  suggestion,
  onProfileClick,
  onFollow,
  t,
}: SuggestedUserCardProps) {
  const { profile, catchCount, commonSpecies } = suggestion;

  return (
    <div className="suggested-user-card" onClick={onProfileClick}>
      <div className="suggested-user-avatar">
        {profile.photoUrl ? (
          <img src={profile.photoUrl} alt={profile.displayName} />
        ) : (
          <User size={32} />
        )}
      </div>
      <div className="suggested-user-info">
        <span className="suggested-user-name">{profile.displayName}</span>
        <span className="suggested-user-stats">
          {catchCount} {t("discover.catches")}
        </span>
        {commonSpecies.length > 0 && (
          <span className="suggested-user-species">
            {commonSpecies.join(", ")}
          </span>
        )}
      </div>
      <button
        className="suggested-user-follow"
        onClick={(e) => {
          e.stopPropagation();
          onFollow();
        }}
      >
        <UserPlus size={18} />
      </button>
    </div>
  );
}
