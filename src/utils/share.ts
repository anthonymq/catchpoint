export interface ShareData {
  title: string;
  text: string;
  url: string;
}

export interface ShareResult {
  success: boolean;
  method: "native" | "clipboard" | "none";
  error?: string;
}

export const canUseNativeShare = (): boolean => {
  return typeof navigator !== "undefined" && "share" in navigator;
};

export const canUseClipboard = (): boolean => {
  return (
    typeof navigator !== "undefined" &&
    "clipboard" in navigator &&
    "writeText" in navigator.clipboard
  );
};

export const getCatchShareUrl = (catchId: string): string => {
  const baseUrl = window.location.origin + (import.meta.env.BASE_URL || "/");
  return `${baseUrl}catch/${catchId}`;
};

export const shareCatch = async (data: ShareData): Promise<ShareResult> => {
  if (canUseNativeShare()) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });
      return { success: true, method: "native" };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return { success: false, method: "native", error: "Share cancelled" };
      }
      console.error("[Share] Native share failed:", err);
    }
  }

  if (canUseClipboard()) {
    try {
      await navigator.clipboard.writeText(data.url);
      return { success: true, method: "clipboard" };
    } catch (err) {
      console.error("[Share] Clipboard failed:", err);
      return {
        success: false,
        method: "clipboard",
        error: "Failed to copy to clipboard",
      };
    }
  }

  return { success: false, method: "none", error: "Sharing not supported" };
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!canUseClipboard()) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("[Share] Clipboard copy failed:", err);
    return false;
  }
};
