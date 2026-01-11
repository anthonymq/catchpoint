import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCatchStore } from "../stores/catchStore";
import { useSettingsStore } from "../stores/settingsStore";
import { catchRepository } from "../db/repository";
import { type Catch } from "../db";
import { SPECIES_LIST } from "../data/species";
import {
  toBaseWeight,
  toBaseLength,
  toDisplayWeight,
  toDisplayLength,
  formatCatchDate,
  formatCoordinates,
} from "../utils/format";
import {
  ChevronLeft,
  Save,
  Trash2,
  Camera,
  MapPin,
  Cloud,
  Calendar,
} from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";
import "../styles/pages/CatchDetail.css";

/** Haptic feedback for actions */
const triggerHaptic = (type: "success" | "error" | "tap" = "tap") => {
  if ("vibrate" in navigator) {
    switch (type) {
      case "success":
        navigator.vibrate([30, 50, 30]); // Double-tap pattern
        break;
      case "error":
        navigator.vibrate([100, 50, 100]); // Warning pattern
        break;
      default:
        navigator.vibrate(15); // Subtle tap
    }
  }
};

export default function CatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateCatch, deleteCatch } = useCatchStore();
  const { weightUnit, lengthUnit } = useSettingsStore();

  const [catchData, setCatchData] = useState<Catch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form State
  const [species, setSpecies] = useState("");
  const [weight, setWeight] = useState<string>("");
  const [length, setLength] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadCatch = async () => {
      if (!id) return;
      try {
        const data = await catchRepository.get(id);
        if (data) {
          setCatchData(data);
          setSpecies(data.species || "");

          if (data.weight) {
            setWeight(toDisplayWeight(data.weight, weightUnit).toFixed(2));
          }
          if (data.length) {
            setLength(toDisplayLength(data.length, lengthUnit).toFixed(1));
          }

          setNotes(data.notes || "");
          setPhotoUri(data.photoUri);
        } else {
          setError("Catch not found");
        }
      } catch (err) {
        setError("Failed to load catch");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCatch();
  }, [id, weightUnit, lengthUnit]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!id || !catchData) return;
    setSaving(true);
    triggerHaptic("tap");

    try {
      const updates: Partial<Catch> = {
        species,
        notes,
        photoUri,
      };

      if (weight) {
        updates.weight = toBaseWeight(parseFloat(weight), weightUnit);
      } else {
        updates.weight = undefined;
      }

      if (length) {
        updates.length = toBaseLength(parseFloat(length), lengthUnit);
      } else {
        updates.length = undefined;
      }

      await updateCatch(id, updates);
      triggerHaptic("success");
      navigate(-1);
    } catch (err) {
      console.error("Failed to save:", err);
      triggerHaptic("error");
      setError("Failed to save changes");
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    triggerHaptic("tap");
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    try {
      triggerHaptic("success");
      await deleteCatch(id);
      navigate(-1);
    } catch (err) {
      console.error("Failed to delete:", err);
      triggerHaptic("error");
      setError("Failed to delete catch");
    }
  };

  if (loading) {
    return (
      <div className="catch-detail-page">
        <div className="catch-detail-header">
          <button className="catch-detail-back" onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="catch-detail-title">Catch Details</h1>
          <div style={{ width: 80 }} />
        </div>
        <div className="catch-detail-content">
          <div className="skeleton skeleton-photo" />
          <div className="skeleton skeleton-text wide" />
          <div className="skeleton skeleton-text medium" />
          <div className="skeleton skeleton-text short" />
        </div>
      </div>
    );
  }

  if (error || !catchData) {
    return (
      <div className="catch-detail-error">{error || "Catch not found"}</div>
    );
  }

  const weather = catchData.weatherData;

  return (
    <div className="catch-detail-page">
      {/* Header */}
      <div className="catch-detail-header">
        <button className="catch-detail-back" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="catch-detail-title">Catch Details</h1>
        <button
          className="catch-detail-save"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="catch-detail-content">
        {/* Photo Area */}
        <div
          className={`catch-detail-photo ${photoUri ? "has-photo" : ""}`}
          onClick={() => fileInputRef.current?.click()}
        >
          {photoUri ? (
            <img src={photoUri} alt="Catch" />
          ) : (
            <div className="catch-detail-photo-placeholder">
              <Camera size={48} />
              <span>Tap to add photo</span>
            </div>
          )}
          <div className="catch-detail-photo-overlay" />
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
          />
        </div>

        {/* Species */}
        <div className="catch-detail-field">
          <label className="catch-detail-label">Species</label>
          <input
            list="species-list"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            placeholder="Select or type species..."
            className="catch-detail-input"
          />
          <datalist id="species-list">
            {SPECIES_LIST.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        {/* Measurements */}
        <div className="catch-detail-measurements">
          <div className="catch-detail-field">
            <label className="catch-detail-label">Weight ({weightUnit})</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.00"
              className="catch-detail-input"
            />
          </div>
          <div className="catch-detail-field">
            <label className="catch-detail-label">Length ({lengthUnit})</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="0.0"
              className="catch-detail-input"
            />
          </div>
        </div>

        {/* Read-only Details */}
        <div className="catch-detail-info">
          <div className="catch-detail-info-row">
            <Calendar size={18} />
            <span>{formatCatchDate(catchData.timestamp)}</span>
          </div>
          <div className="catch-detail-info-row">
            <MapPin size={18} />
            <span>
              {formatCoordinates(catchData.latitude, catchData.longitude)}
            </span>
          </div>
          {weather && (
            <div className="catch-detail-info-row">
              {weather.weatherIcon ? (
                <img
                  src={`https://openweathermap.org/img/wn/${weather.weatherIcon}.png`}
                  alt="Weather icon"
                />
              ) : (
                <Cloud size={18} />
              )}
              <span style={{ textTransform: "capitalize" }}>
                {weather.weatherDescription ||
                  weather.weatherCondition ||
                  "No weather data"}
                {weather.temperature && `, ${Math.round(weather.temperature)}°`}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="catch-detail-field">
          <label className="catch-detail-label">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add details about bait, gear, or conditions..."
            rows={4}
            className="catch-detail-textarea"
          />
        </div>

        {/* Delete Button */}
        <button className="catch-detail-delete" onClick={handleDeleteClick}>
          <Trash2 size={18} />
          Delete Catch
        </button>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Catch?"
        message="Are you sure you want to delete this catch? This action cannot be undone."
        confirmText="Delete"
        cancelText="Keep"
        variant="danger"
      />
    </div>
  );
}
