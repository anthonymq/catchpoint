import { QuickCaptureButton } from "../components/QuickCaptureButton";
import { useTranslation } from "@/i18n";
import "../styles/pages/Home.css";

function getGreetingKey(): { emoji: string; key: string } {
  const hour = new Date().getHours();
  if (hour < 6) return { emoji: "🌙", key: "home.greeting.night" };
  if (hour < 12) return { emoji: "🌅", key: "home.greeting.morning" };
  if (hour < 17) return { emoji: "☀️", key: "home.greeting.afternoon" };
  if (hour < 21) return { emoji: "🌇", key: "home.greeting.evening" };
  return { emoji: "🌙", key: "home.greeting.lateEvening" };
}

export default function Home() {
  const { t } = useTranslation();
  const greeting = getGreetingKey();

  return (
    <div className="home-page">
      <div className="home-greeting">
        <span className="home-greeting-emoji">{greeting.emoji}</span>
        <h1 className="home-greeting-text">{t(greeting.key)}</h1>
        <p className="home-greeting-subtext">{t("home.subtext")}</p>
      </div>

      <div className="home-capture-area">
        <div className="home-capture-glow">
          <QuickCaptureButton />
        </div>
      </div>
    </div>
  );
}
