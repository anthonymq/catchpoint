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

export default function CatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateCatch, deleteCatch } = useCatchStore();
  const { weightUnit, lengthUnit } = useSettingsStore();

  const [catchData, setCatchData] = useState<Catch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

          // Convert stored base units to display units for editing
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

    try {
      const updates: Partial<Catch> = {
        species,
        notes,
        photoUri,
      };

      // Convert display units back to base units for storage
      if (weight) {
        updates.weight = toBaseWeight(parseFloat(weight), weightUnit);
      } else {
        updates.weight = undefined; // Clear if empty
      }

      if (length) {
        updates.length = toBaseLength(parseFloat(length), lengthUnit);
      } else {
        updates.length = undefined; // Clear if empty
      }

      await updateCatch(id, updates);
      navigate(-1);
    } catch (err) {
      console.error("Failed to save:", err);
      setError("Failed to save changes");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (
      window.confirm(
        "Are you sure you want to delete this catch? This action cannot be undone.",
      )
    ) {
      try {
        await deleteCatch(id);
        navigate(-1);
      } catch (err) {
        console.error("Failed to delete:", err);
        setError("Failed to delete catch");
      }
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">
        Loading catch details...
      </div>
    );
  if (error || !catchData)
    return (
      <div className="p-8 text-center text-red-500">
        {error || "Catch not found"}
      </div>
    );

  const weather = catchData.weatherData;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 pb-20 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-700 rounded-full"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Catch Details
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium active:bg-blue-700 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Photo Area */}
        <div
          className="relative w-full aspect-video bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-center cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          {photoUri ? (
            <img
              src={photoUri}
              alt="Catch"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
              <Camera size={48} className="mb-2 opacity-50" />
              <span className="text-sm font-medium">Tap to add photo</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
          />
        </div>

        {/* Species */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Species
          </label>
          <input
            list="species-list"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            placeholder="Select or type species..."
            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <datalist id="species-list">
            {SPECIES_LIST.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        {/* Measurements */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Weight ({weightUnit})
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Length ({lengthUnit})
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="0.0"
              className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Read-only Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <Calendar size={18} className="text-gray-400" />
            <span>{formatCatchDate(catchData.timestamp)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <MapPin size={18} className="text-gray-400" />
            <span>
              {formatCoordinates(catchData.latitude, catchData.longitude)}
            </span>
          </div>
          {weather && (
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              {weather.weather?.[0]?.icon ? (
                <img
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}.png`}
                  alt="Weather icon"
                  className="w-5 h-5 -ml-1"
                />
              ) : (
                <Cloud size={18} className="text-gray-400" />
              )}
              <span className="capitalize">
                {weather.weather?.[0]?.description || "No weather data"},{" "}
                {weather.main?.temp ? `${Math.round(weather.main.temp)}°` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add details about bait, gear, or conditions..."
            rows={4}
            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="w-full py-3 flex items-center justify-center gap-2 text-red-600 active:bg-red-50 dark:active:bg-red-900/20 rounded-lg transition-colors font-medium"
        >
          <Trash2 size={18} />
          Delete Catch
        </button>
      </div>
    </div>
  );
}
