import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useTranslation } from "@/i18n";
import {
  leaderboardRepository,
  type LeaderboardEntry,
  type UserRanking,
} from "../db/repository";
import { getRegionFromId, type Region } from "../utils/region";
import {
  Trophy,
  Fish,
  Calendar,
  TrendingUp,
  ChevronRight,
  Award,
  Target,
  MapPin,
  Users,
} from "lucide-react";
import "../styles/pages/Leaderboards.css";

type LeaderboardTab = "weekly" | "monthly" | "overall" | "species" | "regional";

interface UserRankings {
  overallCatches: UserRanking | null;
  weeklyCatch: UserRanking | null;
  monthlyCatches: UserRanking | null;
}

interface RegionalUserRankings {
  biggestFish: UserRanking | null;
  totalCatches: UserRanking | null;
}

type RegionalSubTab = "biggest" | "heroes";

function LeaderboardSkeleton() {
  return (
    <div className="leaderboard-list">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="leaderboard-item leaderboard-item--skeleton">
          <div className="leaderboard-rank skeleton-shimmer" />
          <div className="leaderboard-avatar skeleton-shimmer" />
          <div className="leaderboard-info">
            <div
              className="skeleton-line skeleton-shimmer"
              style={{ width: "120px", height: "16px" }}
            />
            <div
              className="skeleton-line skeleton-shimmer"
              style={{ width: "80px", height: "12px", marginTop: "4px" }}
            />
          </div>
          <div
            className="skeleton-line skeleton-shimmer"
            style={{ width: "50px", height: "20px" }}
          />
        </div>
      ))}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="rank-badge rank-badge--gold">1</span>;
  if (rank === 2)
    return <span className="rank-badge rank-badge--silver">2</span>;
  if (rank === 3)
    return <span className="rank-badge rank-badge--bronze">3</span>;
  return <span className="rank-badge">{rank}</span>;
}

function LeaderboardItem({
  entry,
  isCurrentUser,
  valueLabel,
  onClick,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  valueLabel: string;
  onClick: () => void;
}) {
  return (
    <div
      className={`leaderboard-item ${isCurrentUser ? "leaderboard-item--current" : ""}`}
      onClick={onClick}
    >
      <RankBadge rank={entry.rank} />
      <div className="leaderboard-avatar">
        {entry.photoUrl ? (
          <img src={entry.photoUrl} alt="" />
        ) : (
          <div className="leaderboard-avatar-placeholder">
            {entry.displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="leaderboard-info">
        <span className="leaderboard-name">{entry.displayName}</span>
        {entry.species && (
          <span className="leaderboard-species">{entry.species}</span>
        )}
      </div>
      <div className="leaderboard-value">
        {valueLabel}
        <ChevronRight size={16} className="leaderboard-chevron" />
      </div>
    </div>
  );
}

function MyRankingCard({
  title,
  icon: Icon,
  ranking,
  valueFormatter,
  valueUnit,
  t,
}: {
  title: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  ranking: UserRanking | null;
  valueFormatter: (v: number) => string;
  valueUnit: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  if (!ranking) {
    return (
      <div className="my-ranking-card my-ranking-card--empty">
        <Icon size={24} className="my-ranking-icon" />
        <span className="my-ranking-title">{title}</span>
        <span className="my-ranking-empty">{t("leaderboards.notRanked")}</span>
      </div>
    );
  }

  return (
    <div className="my-ranking-card">
      <Icon size={24} className="my-ranking-icon" />
      <span className="my-ranking-title">{title}</span>
      <div className="my-ranking-stats">
        <span className="my-ranking-rank">#{ranking.rank}</span>
        <span className="my-ranking-value">
          {valueFormatter(ranking.value)} {valueUnit}
        </span>
      </div>
      {ranking.rank > 10 && ranking.distanceToTopTen > 0 && (
        <div className="my-ranking-motivation">
          <Target size={12} />
          <span>
            {t("leaderboards.awayFromTop", {
              count: valueFormatter(ranking.distanceToTopTen),
            })}
          </span>
        </div>
      )}
    </div>
  );
}

function RegionalHeader({
  region,
  t,
}: {
  region: Region | null;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  if (!region) {
    return (
      <div className="regional-header regional-header--empty">
        <MapPin size={20} />
        <span>{t("leaderboards.regional.noRegion")}</span>
      </div>
    );
  }

  return (
    <div className="regional-header">
      <MapPin size={20} />
      <span>{t("leaderboards.regional.yourRegion")}</span>
      <span className="regional-name">{region.displayName}</span>
    </div>
  );
}

export default function Leaderboards() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<LeaderboardTab>("weekly");
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<LeaderboardEntry[]>([]);
  const [monthlyData, setMonthlyData] = useState<LeaderboardEntry[]>([]);
  const [overallData, setOverallData] = useState<LeaderboardEntry[]>([]);
  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string>("");
  const [speciesData, setSpeciesData] = useState<LeaderboardEntry[]>([]);
  const [userRankings, setUserRankings] = useState<UserRankings>({
    overallCatches: null,
    weeklyCatch: null,
    monthlyCatches: null,
  });

  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const [regionalSubTab, setRegionalSubTab] =
    useState<RegionalSubTab>("biggest");
  const [regionalBiggestData, setRegionalBiggestData] = useState<
    LeaderboardEntry[]
  >([]);
  const [localHeroesData, setLocalHeroesData] = useState<LeaderboardEntry[]>(
    [],
  );
  const [regionalUserRankings, setRegionalUserRankings] =
    useState<RegionalUserRankings>({
      biggestFish: null,
      totalCatches: null,
    });

  const loadRegionalData = useCallback(
    async (regionId: string) => {
      const [biggest, heroes] = await Promise.all([
        leaderboardRepository.getRegionalBiggestFish(regionId, 10),
        leaderboardRepository.getLocalHeroes(regionId, 10),
      ]);

      setRegionalBiggestData(biggest);
      setLocalHeroesData(heroes);

      if (user) {
        const rankings = await leaderboardRepository.getRegionalUserRanking(
          user.uid,
          regionId,
        );
        setRegionalUserRankings(rankings);
      }
    },
    [user],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [weekly, monthly, overall, species] = await Promise.all([
        leaderboardRepository.getWeeklyBiggestCatch(10),
        leaderboardRepository.getMonthlyMostCatches(10),
        leaderboardRepository.getMostCatchesOverall(50),
        leaderboardRepository.getAllSpecies(),
      ]);

      setWeeklyData(weekly);
      setMonthlyData(monthly);
      setOverallData(overall);
      setSpeciesList(species);

      if (species.length > 0 && !selectedSpecies) {
        setSelectedSpecies(species[0]);
        const speciesLeaderboard =
          await leaderboardRepository.getBiggestFishBySpecies(species[0], 10);
        setSpeciesData(speciesLeaderboard);
      }

      if (user) {
        const [rankings, regionId] = await Promise.all([
          leaderboardRepository.getUserRankings(user.uid),
          leaderboardRepository.getUserPrimaryRegion(user.uid),
        ]);
        setUserRankings(rankings);

        if (regionId) {
          const region = getRegionFromId(regionId);
          setUserRegion(region);
          await loadRegionalData(regionId);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user, selectedSpecies, loadRegionalData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSpeciesChange = async (species: string) => {
    setSelectedSpecies(species);
    const data = await leaderboardRepository.getBiggestFishBySpecies(
      species,
      10,
    );
    setSpeciesData(data);
  };

  const getActiveData = () => {
    switch (activeTab) {
      case "weekly":
        return weeklyData;
      case "monthly":
        return monthlyData;
      case "overall":
        return overallData;
      case "species":
        return speciesData;
      case "regional":
        return regionalSubTab === "biggest"
          ? regionalBiggestData
          : localHeroesData;
      default:
        return [];
    }
  };

  const getValueLabel = (entry: LeaderboardEntry) => {
    switch (activeTab) {
      case "weekly":
        return `${entry.value.toFixed(1)} lb`;
      case "species":
        return `${entry.value.toFixed(1)} lb`;
      case "regional":
        if (regionalSubTab === "biggest") {
          return `${entry.value.toFixed(1)} lb`;
        }
        return `${entry.value} ${t("leaderboards.catches")}`;
      case "monthly":
      case "overall":
        return `${entry.value} ${t("leaderboards.catches")}`;
      default:
        return String(entry.value);
    }
  };

  const tabs: { id: LeaderboardTab; label: string; icon: typeof Trophy }[] = [
    { id: "weekly", label: t("leaderboards.tabs.weekly"), icon: Calendar },
    { id: "monthly", label: t("leaderboards.tabs.monthly"), icon: TrendingUp },
    { id: "overall", label: t("leaderboards.tabs.overall"), icon: Trophy },
    { id: "species", label: t("leaderboards.tabs.species"), icon: Fish },
    { id: "regional", label: t("leaderboards.tabs.regional"), icon: MapPin },
  ];

  return (
    <div className="leaderboards-page">
      <header className="leaderboards-header">
        <div className="leaderboards-header-content">
          <Trophy size={28} className="leaderboards-icon" />
          <h1>{t("leaderboards.title")}</h1>
        </div>
      </header>

      {user && activeTab !== "regional" && (
        <section className="my-rankings-section">
          <h2 className="my-rankings-title">
            <Award size={18} />
            {t("leaderboards.myRankings")}
          </h2>
          <div className="my-rankings-grid">
            <MyRankingCard
              title={t("leaderboards.tabs.weekly")}
              icon={Calendar}
              ranking={userRankings.weeklyCatch}
              valueFormatter={(v) => v.toFixed(1)}
              valueUnit="lb"
              t={t}
            />
            <MyRankingCard
              title={t("leaderboards.tabs.monthly")}
              icon={TrendingUp}
              ranking={userRankings.monthlyCatches}
              valueFormatter={(v) => String(Math.round(v))}
              valueUnit={t("leaderboards.catches")}
              t={t}
            />
            <MyRankingCard
              title={t("leaderboards.tabs.overall")}
              icon={Trophy}
              ranking={userRankings.overallCatches}
              valueFormatter={(v) => String(Math.round(v))}
              valueUnit={t("leaderboards.catches")}
              t={t}
            />
          </div>
        </section>
      )}

      {user && activeTab === "regional" && (
        <section className="my-rankings-section">
          <RegionalHeader region={userRegion} t={t} />
          <h2 className="my-rankings-title">
            <Award size={18} />
            {t("leaderboards.regional.myRegionalRanks")}
          </h2>
          <div className="my-rankings-grid my-rankings-grid--two">
            <MyRankingCard
              title={t("leaderboards.regional.biggestFish")}
              icon={Fish}
              ranking={regionalUserRankings.biggestFish}
              valueFormatter={(v) => v.toFixed(1)}
              valueUnit="lb"
              t={t}
            />
            <MyRankingCard
              title={t("leaderboards.regional.totalCatches")}
              icon={Target}
              ranking={regionalUserRankings.totalCatches}
              valueFormatter={(v) => String(Math.round(v))}
              valueUnit={t("leaderboards.catches")}
              t={t}
            />
          </div>
        </section>
      )}

      <div className="leaderboards-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`leaderboard-tab ${activeTab === tab.id ? "leaderboard-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "species" && (
        <div className="species-selector">
          <select
            value={selectedSpecies}
            onChange={(e) => handleSpeciesChange(e.target.value)}
            className="species-select"
          >
            {speciesList.map((species) => (
              <option key={species} value={species}>
                {species}
              </option>
            ))}
          </select>
        </div>
      )}

      {activeTab === "regional" && (
        <div className="regional-subtabs">
          <button
            className={`regional-subtab ${regionalSubTab === "biggest" ? "regional-subtab--active" : ""}`}
            onClick={() => setRegionalSubTab("biggest")}
          >
            <Fish size={16} />
            <span>{t("leaderboards.regional.biggestFish")}</span>
          </button>
          <button
            className={`regional-subtab ${regionalSubTab === "heroes" ? "regional-subtab--active" : ""}`}
            onClick={() => setRegionalSubTab("heroes")}
          >
            <Users size={16} />
            <span>{t("leaderboards.regional.localHeroes")}</span>
          </button>
        </div>
      )}

      <section className="leaderboard-section">
        <h2 className="leaderboard-section-title">
          {activeTab === "weekly" && t("leaderboards.weeklyBiggest")}
          {activeTab === "monthly" && t("leaderboards.monthlyMost")}
          {activeTab === "overall" && t("leaderboards.overallMost")}
          {activeTab === "species" &&
            t("leaderboards.biggestBySpecies", { species: selectedSpecies })}
          {activeTab === "regional" &&
            regionalSubTab === "biggest" &&
            t("leaderboards.regional.biggestFishTitle")}
          {activeTab === "regional" &&
            regionalSubTab === "heroes" &&
            t("leaderboards.regional.localHeroesTitle")}
        </h2>

        {loading ? (
          <LeaderboardSkeleton />
        ) : activeTab === "regional" && !userRegion ? (
          <div className="leaderboard-empty">
            <MapPin size={48} className="leaderboard-empty-icon" />
            <p>{t("leaderboards.regional.noRegionHint")}</p>
          </div>
        ) : getActiveData().length === 0 ? (
          <div className="leaderboard-empty">
            <Fish size={48} className="leaderboard-empty-icon" />
            <p>{t("leaderboards.empty")}</p>
          </div>
        ) : (
          <div className="leaderboard-list">
            {getActiveData().map((entry) => (
              <LeaderboardItem
                key={`${entry.userId}-${entry.rank}`}
                entry={entry}
                isCurrentUser={entry.userId === user?.uid}
                valueLabel={getValueLabel(entry)}
                onClick={() => navigate(`/profile/${entry.userId}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
