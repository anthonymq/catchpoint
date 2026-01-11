import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function Layout() {
  return (
    <div className="flex flex-col h-full w-full">
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ paddingBottom: "calc(76px + var(--safe-area-bottom, 0px))" }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
