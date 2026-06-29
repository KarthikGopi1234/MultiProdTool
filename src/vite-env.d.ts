/// <reference types="vite/client" />

interface Window {
  multiProd?: {
    close: () => void;
    minimize: () => void;
    maximize: () => void;
    notify: (title: string, body: string) => void;
    getLibrary: () => Promise<string | null>;
    chooseLibrary: () => Promise<string | null>;
    loadData: () => Promise<unknown | null>;
    saveData: (data: unknown) => Promise<{ ok: boolean; path?: string; error?: string }>;
    platform: string;
  };
}
