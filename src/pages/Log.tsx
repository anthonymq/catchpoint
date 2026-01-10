import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Fish } from "lucide-react";
import { useCatchStore } from "../stores/catchStore";
import { CatchCard } from "../components/CatchCard";
import { db } from "../db";
import { generateTestCatches } from "../data/testCatches";
import "../styles/pages/Log.css";

export default function Log() {
  const { catches, fetchCatches, deleteCatch } = useCatchStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCatches();
  }, [fetchCatches]);

  const handleLoadTestData = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm("Load 20 test catches? This will add to your existing data.")) {
      const testData = generateTestCatches();
      await db.catches.bulkAdd(testData);
      fetchCatches();
    }
  };

  if (catches.length === 0) {
    return (
      <div className="log-empty-state">
        <div className="log-empty-icon">
          <Fish size={64} />
        </div>
        <h2 className="log-empty-title">No catches yet!</h2>
        <p className="log-empty-text">
          Tap "FISH ON!" on the home screen to log your first catch.
        </p>

        <Link to="/" className="btn-primary">
          Go to Capture
        </Link>

        {/* Dev only */}
        <button onClick={handleLoadTestData} className="btn-link">
          [DEV] Load Test Data
        </button>
      </div>
    );
  }

  return (
    <div className="log-page">
      <div className="log-header">
        <h1 className="log-title">Catch Log</h1>
        <p className="log-subtitle">{catches.length} catches recorded</p>
      </div>

      <div className="log-list">
        {catches.map((catchItem) => (
          <CatchCard
            key={catchItem.id}
            catchData={catchItem}
            onDelete={deleteCatch}
            onClick={(id) => navigate(`/catch/${id}`)}
          />
        ))}
      </div>
    </div>
  );
}
