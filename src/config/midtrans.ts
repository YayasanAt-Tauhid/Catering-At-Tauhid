// Midtrans Configuration
// Automatically switches between Sandbox and Production based on environment variable

// Debug: Log all Midtrans-related environment variables
console.log("[Midtrans Config] Environment variables:", {
  VITE_MIDTRANS_IS_PRODUCTION: import.meta.env.VITE_MIDTRANS_IS_PRODUCTION,
  VITE_MIDTRANS_CLIENT_KEY_SANDBOX: import.meta.env.VITE_MIDTRANS_CLIENT_KEY_SANDBOX ? "SET" : "NOT SET",
  VITE_MIDTRANS_CLIENT_KEY_PRODUCTION: import.meta.env.VITE_MIDTRANS_CLIENT_KEY_PRODUCTION ? "SET" : "NOT SET",
});

const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === "true";

// Client Keys with fallbacks
const sandboxClientKey =
  import.meta.env.VITE_MIDTRANS_CLIENT_KEY_SANDBOX || "SB-Mid-client-8LumxhWCUi6hVWMv";
const productionClientKey =
  import.meta.env.VITE_MIDTRANS_CLIENT_KEY_PRODUCTION || "";

export const midtransConfig = {
  isProduction,

  // Client Key based on mode
  clientKey: isProduction ? productionClientKey : sandboxClientKey,

  // Snap Script URLs
  snapScriptUrl: isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js",

  // Dashboard URLs (for reference)
  dashboardUrl: isProduction
    ? "https://dashboard.midtrans.com/"
    : "https://dashboard.sandbox.midtrans.com/",
};

// Debug: Log final configuration
console.log("[Midtrans Config] Final configuration:", {
  isProduction: midtransConfig.isProduction,
  clientKey: midtransConfig.clientKey ? `${midtransConfig.clientKey.substring(0, 15)}...` : "NOT SET",
  snapScriptUrl: midtransConfig.snapScriptUrl,
});

// Function to dynamically load Midtrans Snap script
export const loadMidtransScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log("[Midtrans] Loading Snap script...", {
      url: midtransConfig.snapScriptUrl,
      isProduction: midtransConfig.isProduction,
    });

    // Check if already loaded
    if (window.snap) {
      console.log("[Midtrans] Snap already loaded");
      resolve();
      return;
    }

    // Remove any existing Midtrans script (to handle mode switch)
    const existingScripts = document.querySelectorAll(
      'script[src*="midtrans.com/snap/snap.js"]'
    );
    existingScripts.forEach((script) => {
      console.log("[Midtrans] Removing existing script:", script.getAttribute("src"));
      script.remove();
    });

    // Reset window.snap if it exists but we removed the script
    if (existingScripts.length > 0) {
      (window as any).snap = undefined;
    }

    // Create and load script
    const script = document.createElement("script");
    script.src = midtransConfig.snapScriptUrl;
    script.setAttribute("data-client-key", midtransConfig.clientKey);
    script.async = true;

    script.onload = () => {
      console.log(
        `[Midtrans] Snap loaded successfully (${midtransConfig.isProduction ? "Production" : "Sandbox"})`
      );
      resolve();
    };

    script.onerror = (error) => {
      console.error("[Midtrans] Failed to load Snap script:", error);
      reject(new Error("Failed to load Midtrans Snap script"));
    };

    document.head.appendChild(script);
  });
};

// Type declaration for window.snap
declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export default midtransConfig;
