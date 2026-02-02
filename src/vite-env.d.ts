/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_MIDTRANS_IS_PRODUCTION: string;
  readonly VITE_MIDTRANS_CLIENT_KEY_SANDBOX: string;
  readonly VITE_MIDTRANS_CLIENT_KEY_PRODUCTION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
