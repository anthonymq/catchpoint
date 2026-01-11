import { QuickCaptureButton } from "../components/QuickCaptureButton";
import "../styles/pages/Home.css";

function getGreeting(): { emoji: string; text: string } {
  const hour = new Date().getHours();
  if (hour < 6) return { emoji: "🌙", text: "Night owl fishing?" };
  if (hour < 12) return { emoji: "🌅", text: "Good morning!" };
  if (hour < 17) return { emoji: "☀️", text: "Good afternoon!" };
  if (hour < 21) return { emoji: "🌇", text: "Golden hour time!" };
  return { emoji: "🌙", text: "Evening fishing?" };
}

export default function Home() {
  const greeting = getGreeting();

  return (
    <div className="home-page">
      <div className="home-greeting">
        <span className="home-greeting-emoji">{greeting.emoji}</span>
        <h1 className="home-greeting-text">{greeting.text}</h1>
        <p className="home-greeting-subtext">Ready to catch something great?</p>
      </div>

      <div className="home-capture-area">
        <div className="home-capture-glow">
          <QuickCaptureButton />
        </div>
      </div>
    </div>
  );
}
