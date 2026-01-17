import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  Edit2,
  Check,
  X,
  Eye,
  EyeOff,
  Fish,
  Scale,
  Hash,
  User,
} from "lucide-react";
import { useProfileStore } from "@/stores/profileStore";
import { useAuthStore } from "@/stores/authStore";
import { useCatchStore } from "@/stores/catchStore";
import { cropAndCompressImage } from "@/services/profile";
import { calculateStatistics } from "@/utils/statistics";
import { useTranslation } from "@/i18n";
import { useSettingsStore } from "@/stores/settingsStore";
import "@/styles/pages/Profile.css";

export default function Profile() {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuthStore();
  const {
    profile,
    loading,
    fetchProfile,
    createProfile,
    updateDisplayName,
    updatePhoto,
    toggleVisibility,
  } = useProfileStore();
  const { catches, fetchCatches } = useCatchStore();
  const { weightUnit } = useSettingsStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const isOwnProfile = user?.uid === userId;
  const targetUserId = userId || user?.uid;

  useEffect(() => {
    if (targetUserId) {
      fetchProfile(targetUserId);
      fetchCatches();
    }
  }, [targetUserId, fetchProfile, fetchCatches]);

  useEffect(() => {
    if (!profile && user && isOwnProfile && !loading) {
      createProfile({
        userId: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "Angler",
        isPublic: false,
      });
    }
  }, [profile, user, isOwnProfile, loading, createProfile]);

  useEffect(() => {
    if (profile) {
      setEditedName(profile.displayName);
    }
  }, [profile]);

  const stats = useMemo(() => {
    const userCatches = catches.filter(
      (c) => !userId || c.userId === userId || c.userId === undefined,
    );
    return calculateStatistics(userCatches);
  }, [catches, userId]);

  const handlePhotoClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const compressedPhoto = await cropAndCompressImage(file);
      await updatePhoto(compressedPhoto);
    } catch (error) {
      console.error("[Profile] Failed to upload photo:", error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveName = async () => {
    if (editedName.trim() && editedName !== profile?.displayName) {
      await updateDisplayName(editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditedName(profile?.displayName || "");
    setIsEditingName(false);
  };

  const handleToggleVisibility = async () => {
    await toggleVisibility();
  };

  const formatWeight = (weight: number) => {
    if (weightUnit === "kg") {
      return `${(weight * 0.453592).toFixed(1)} kg`;
    }
    return `${weight.toFixed(1)} lbs`;
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">{t("common.loading")}</div>
      </div>
    );
  }

  if (!profile && !isOwnProfile) {
    return (
      <div className="profile-page">
        <header className="profile-header">
          <button onClick={() => navigate(-1)} className="profile-back-button">
            <ArrowLeft size={24} />
          </button>
          <h1 className="profile-header-title">{t("profile.title")}</h1>
        </header>
        <div className="profile-not-found">
          <User size={48} />
          <p>{t("profile.notFound")}</p>
        </div>
      </div>
    );
  }

  if (profile && !profile.isPublic && !isOwnProfile) {
    return (
      <div className="profile-page">
        <header className="profile-header">
          <button onClick={() => navigate(-1)} className="profile-back-button">
            <ArrowLeft size={24} />
          </button>
          <h1 className="profile-header-title">{t("profile.title")}</h1>
        </header>
        <div className="profile-private">
          <EyeOff size={48} />
          <p>{t("profile.privateProfile")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <button onClick={() => navigate(-1)} className="profile-back-button">
          <ArrowLeft size={24} />
        </button>
        <h1 className="profile-header-title">{t("profile.title")}</h1>
      </header>

      <div className="profile-content">
        <div className="profile-avatar-section">
          <button
            className={`profile-avatar ${isOwnProfile ? "editable" : ""}`}
            onClick={handlePhotoClick}
            disabled={!isOwnProfile || uploadingPhoto}
          >
            {profile?.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.displayName}
                className="profile-avatar-image"
              />
            ) : (
              <User size={48} className="profile-avatar-placeholder" />
            )}
            {isOwnProfile && (
              <div className="profile-avatar-overlay">
                <Camera size={20} />
              </div>
            )}
            {uploadingPhoto && (
              <div className="profile-avatar-loading">
                {t("common.loading")}
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="profile-photo-input"
          />
        </div>

        <div className="profile-name-section">
          {isEditingName ? (
            <div className="profile-name-edit">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="profile-name-input"
                autoFocus
                maxLength={30}
              />
              <div className="profile-name-actions">
                <button onClick={handleSaveName} className="profile-name-save">
                  <Check size={18} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="profile-name-cancel"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-name-display">
              <h2 className="profile-display-name">{profile?.displayName}</h2>
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="profile-edit-button"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {isOwnProfile && (
          <div className="profile-visibility-section">
            <button
              onClick={handleToggleVisibility}
              className="profile-visibility-toggle"
            >
              {profile?.isPublic ? (
                <>
                  <Eye size={18} />
                  <span>{t("profile.public")}</span>
                </>
              ) : (
                <>
                  <EyeOff size={18} />
                  <span>{t("profile.private")}</span>
                </>
              )}
            </button>
            <p className="profile-visibility-hint">
              {profile?.isPublic
                ? t("profile.publicHint")
                : t("profile.privateHint")}
            </p>
          </div>
        )}

        <div className="profile-stats">
          <h3 className="profile-stats-title">{t("profile.stats.title")}</h3>
          <div className="profile-stats-grid">
            <div className="profile-stat-card">
              <div className="profile-stat-icon">
                <Hash size={24} />
              </div>
              <div className="profile-stat-content">
                <span className="profile-stat-value">{stats.totalCatches}</span>
                <span className="profile-stat-label">
                  {t("profile.stats.totalCatches")}
                </span>
              </div>
            </div>

            <div className="profile-stat-card">
              <div className="profile-stat-icon">
                <Fish size={24} />
              </div>
              <div className="profile-stat-content">
                <span className="profile-stat-value">
                  {stats.topSpecies.length}
                </span>
                <span className="profile-stat-label">
                  {t("profile.stats.speciesCount")}
                </span>
              </div>
            </div>

            <div className="profile-stat-card profile-stat-card--full">
              <div className="profile-stat-icon">
                <Scale size={24} />
              </div>
              <div className="profile-stat-content">
                <span className="profile-stat-value">
                  {stats.biggestCatch
                    ? formatWeight(stats.biggestCatch.weight)
                    : "—"}
                </span>
                <span className="profile-stat-label">
                  {t("profile.stats.biggestFish")}
                  {stats.biggestCatch?.species && (
                    <span className="profile-stat-species">
                      {" "}
                      ({stats.biggestCatch.species})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {stats.topSpecies.length > 0 && (
          <div className="profile-top-species">
            <h3 className="profile-section-title">{t("profile.topSpecies")}</h3>
            <div className="profile-species-list">
              {stats.topSpecies.slice(0, 5).map((species, index) => (
                <div key={species.species} className="profile-species-item">
                  <span className="profile-species-rank">#{index + 1}</span>
                  <span className="profile-species-name">
                    {species.species}
                  </span>
                  <span className="profile-species-count">{species.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
