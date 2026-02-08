// Midtrans Configuration
// Automatically switches between Sandbox and Production based on environment variable

const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === "true";

export const midtransConfig = {
  isProduction,

  // Client Keys
  clientKey: isProduction
    ? import.meta.env.VITE_MIDTRANS_CLIENT_KEY_PRODUCTION ||
      "Mid-client-xxxxxxxxxxxxxxxx"
    : import.meta.env.VITE_MIDTRANS_CLIENT_KEY_SANDBOX ||
      "SB-Mid-client-xxxxxxxxxxxxxxxx",

  // Snap Script URLs
  snapScriptUrl: isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js",

  // Dashboard URLs (for reference)
  dashboardUrl: isProduction
    ? "https://dashboard.midtrans.com/"
    : "https://dashboard.sandbox.midtrans.com/",
};

// Function to dynamically load Midtrans Snap script
export const loadMidtransScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.snap) {
      resolve();
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector(
      'script[src*="midtrans.com/snap/snap.js"]',
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () =>
        reject(new Error("Failed to load Midtrans script")),
      );
      return;
    }

    // Create and load script
    const script = document.createElement("script");
    script.src = midtransConfig.snapScriptUrl;
    script.setAttribute("data-client-key", midtransConfig.clientKey);
    script.async = true;

    script.onload = () => {
      console.log(
        `Midtrans Snap loaded (${midtransConfig.isProduction ? "Production" : "Sandbox"})`,
      );
      resolve();
    };

    script.onerror = () => {
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
        },
      ) => void;
    };
  }
}

export default midtransConfig;
