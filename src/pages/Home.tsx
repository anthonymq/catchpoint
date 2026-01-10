import { QuickCaptureButton } from "../components/QuickCaptureButton";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4">
      {/* 
        We could add a recent catches summary here later, 
        but for now the focus is on the button.
      */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <QuickCaptureButton />
      </div>
    </div>
  );
}
